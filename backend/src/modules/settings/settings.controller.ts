import { Request, Response } from "express";
import RestaurantSettings from "../../models/RestaurantSettings.model";
import ApiResponse from "../../utils/ApiResponse";
import asyncHandler from "../../utils/asyncHandler";

// GET /api/v1/settings — returns the single settings document (creates default if missing)
export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  let settings = await RestaurantSettings.findOne();
  if (!settings) settings = await RestaurantSettings.create({});
  return ApiResponse.success(res, "Settings retrieved", settings);
});

// PATCH /api/v1/settings — upsert settings
export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const allowed = [
    "restaurantName", "address", "phone", "openTime", "closeTime",
    "gstPercent", "deliveryCharge", "freeDeliveryAbove",
    "autoAcceptOrders", "emailNotifications",
  ];
  const numericKeys = ["gstPercent", "deliveryCharge", "freeDeliveryAbove"];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (req.body[key] === undefined) continue;
    if (numericKeys.includes(key)) {
      updates[key] = Number(req.body[key]);
    } else {
      updates[key] = req.body[key];
    }
  }

  const settings = await RestaurantSettings.findOneAndUpdate(
    {},
    { $set: updates },
    { new: true, upsert: true, runValidators: true }
  );
  return ApiResponse.success(res, "Settings updated", settings);
});
