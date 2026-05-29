import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError";
import asyncHandler from "../utils/asyncHandler";
import User from "../models/User.model";

export const authenticate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw ApiError.unauthorized("No token provided");
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) throw new Error("JWT_ACCESS_SECRET is not configured");

    const decoded = jwt.verify(token, secret) as { userId: string; role: string };
    const user = await User.findById(decoded.userId).select("-password -refreshToken");

    if (!user || !user.isActive) {
      throw ApiError.unauthorized("User not found or inactive");
    }

    req.user = user.toSafeObject() as any;
    next();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw ApiError.unauthorized("Invalid or expired token");
  }
});

export const optionalAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) throw new Error("JWT_ACCESS_SECRET is not configured");

    const decoded = jwt.verify(token, secret) as { userId: string; role: string };
    const user = await User.findById(decoded.userId).select("-password -refreshToken");
    if (user && user.isActive) {
      req.user = user.toSafeObject() as any;
    }
  } catch (_) {
    // ignore invalid token in optional auth
  }
  next();
});
