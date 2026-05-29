import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";
import { Role } from "../shared/constants/roles";

export const requireRole = (...roles: Role[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  if (!roles.includes(req.user.role)) {
    throw ApiError.forbidden(`Requires role: ${roles.join(" or ")}`);
  }
  next();
};
