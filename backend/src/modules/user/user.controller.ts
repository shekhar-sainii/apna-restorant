import { Request, Response } from "express";
import userService from "./user.service";
import ApiResponse from "../../utils/ApiResponse";
import asyncHandler from "../../utils/asyncHandler";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await userService.getProfile(req.user!._id.toString());
  return ApiResponse.success(res, "Profile retrieved successfully", profile);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await userService.updateProfile(req.user!._id.toString(), req.body);
  return ApiResponse.success(res, "Profile updated successfully", profile);
});

export const getAddresses = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await userService.getAddresses(req.user!._id.toString());
  return ApiResponse.success(res, "Addresses retrieved successfully", addresses);
});

export const addAddress = asyncHandler(async (req: Request, res: Response) => {
  const address = await userService.addAddress(req.user!._id.toString(), req.body);
  return ApiResponse.success(res, "Address added successfully", address, 201);
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const address = await userService.updateAddress(req.user!._id.toString(), req.params.id, req.body);
  return ApiResponse.success(res, "Address updated successfully", address);
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  const address = await userService.deleteAddress(req.user!._id.toString(), req.params.id);
  return ApiResponse.success(res, "Address deleted successfully", address);
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await userService.getAllUsers();
  return ApiResponse.success(res, "All users retrieved successfully", users);
});

export const toggleUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body;
  const user = await userService.updateUserStatus(
    req.params.id,
    isActive !== undefined ? Boolean(isActive) : undefined
  );
  return ApiResponse.success(res, "User status updated successfully", user);
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body;
  const user = await userService.updateUserRole(
    req.params.id,
    role,
    req.user!._id.toString()
  );
  return ApiResponse.success(res, "User role updated successfully", user);
});
