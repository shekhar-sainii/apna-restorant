import { Request, Response } from "express";
import categoryService from "./category.service";
import ApiResponse from "../../utils/ApiResponse";
import asyncHandler from "../../utils/asyncHandler";

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive === "true";
  const categories = await categoryService.getAll(includeInactive);
  return ApiResponse.success(res, "Categories retrieved successfully", categories);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { name, sortOrder } = req.body;
  const file = req.file;
  const category = await categoryService.create({ name, sortOrder, file });
  return ApiResponse.created(res, "Category created successfully", category);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, isActive, sortOrder } = req.body;
  const file = req.file;
  const category = await categoryService.update(id, { name, isActive, sortOrder, file });
  return ApiResponse.success(res, "Category updated successfully", category);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await categoryService.delete(id);
  return ApiResponse.success(res, "Category deleted successfully", null);
});
