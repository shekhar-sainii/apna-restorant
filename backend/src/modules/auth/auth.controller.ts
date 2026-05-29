import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import authService from "./auth.service";
import GuestSession from "../../models/GuestSession.model";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import asyncHandler from "../../utils/asyncHandler";
import emailService from "../../services/email.service";
import logger from "../../utils/logger";

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body;
  const result = await authService.register({ name, email, phone, password } as any);

  res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);

  emailService.sendWelcomeEmail(result.user.email, result.user.name).catch((err) => {
    logger.error(`Failed to send welcome email: ${err.message}`);
  });

  return ApiResponse.created(res, "Registration successful", {
    user: result.user,
    accessToken: result.accessToken,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password } as any);

  res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);

  return ApiResponse.success(res, "Login successful", {
    user: result.user,
    accessToken: result.accessToken,
  });
});

export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body;
  const result = await authService.googleLogin(idToken);

  res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);

  if ((result.user as any).isNewUser) {
    emailService.sendWelcomeEmail(result.user.email, result.user.name).catch((err) => {
      logger.error(`Failed to send welcome email for google registration: ${err.message}`);
    });
  }

  return ApiResponse.success(res, "Google login successful", {
    user: result.user,
    accessToken: result.accessToken,
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const resetToken = await authService.forgotPassword(email);

  emailService.sendResetPasswordEmail(email, "Valued Customer", resetToken).catch((err) => {
    logger.error(`Failed to send password reset email: ${err.message}`);
  });

  return ApiResponse.success(res, "Password reset email sent successfully", null);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);
  return ApiResponse.success(res, "Password reset successful", null);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  const result = await authService.refresh(refreshToken);

  res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);

  return ApiResponse.success(res, "Token refreshed", {
    accessToken: result.accessToken,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?._id) {
    throw ApiError.unauthorized("Not authenticated");
  }
  await authService.logout(req.user._id);
  res.clearCookie("refreshToken");
  return ApiResponse.success(res, "Logged out successfully", null);
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  return ApiResponse.success(res, "User data", req.user);
});

export const createGuestSession = asyncHandler(async (req: Request, res: Response) => {
  const { tableNumber } = req.body;
  const guestSessionId = uuidv4();

  await GuestSession.create({
    guestSessionId,
    tableNumber: tableNumber || null,
    ipAddress: req.ip,
  });

  return ApiResponse.created(res, "Guest session created", { guestSessionId });
});
