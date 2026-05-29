import { Request, Response } from "express";
import notificationService from "./notification.service";
import ApiResponse from "../../utils/ApiResponse";
import asyncHandler from "../../utils/asyncHandler";

export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const notifs = await notificationService.getMyNotifications(req.user);
  return ApiResponse.success(res, "My notifications retrieved", notifs);
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const notif = await notificationService.markRead(req.params.id, req.user);
  return ApiResponse.success(res, "Notification marked as read", notif);
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.markAllRead(req.user);
  return ApiResponse.success(res, "All notifications marked as read", null);
});
