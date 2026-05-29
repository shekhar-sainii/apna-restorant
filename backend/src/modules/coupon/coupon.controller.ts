import { Request, Response } from "express";
import couponService from "./coupon.service";
import ApiResponse from "../../utils/ApiResponse";
import asyncHandler from "../../utils/asyncHandler";

export const getActiveOffers = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await couponService.getActivePublicOffers();
  return ApiResponse.success(res, "Active offers", coupons);
});

export const applyCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, subtotal } = req.body;
  const result = await couponService.validateAndApplyCoupon(code, subtotal);
  return ApiResponse.success(res, "Coupon applied successfully", {
    code: result.coupon.code,
    type: result.coupon.type,
    value: result.coupon.value,
    discountAmount: result.discountAmount,
  });
});

export const getCoupons = asyncHandler(async (req: Request, res: Response) => {
  const coupons = await couponService.getAllCoupons();
  return ApiResponse.success(res, "All coupons retrieved", coupons);
});

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponService.createCoupon(req.body);
  return ApiResponse.success(res, "Coupon created successfully", coupon, 201);
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponService.updateCoupon(req.params.id, req.body);
  return ApiResponse.success(res, "Coupon updated successfully", coupon);
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponService.deleteCoupon(req.params.id);
  return ApiResponse.success(res, "Coupon deleted successfully", coupon);
});
