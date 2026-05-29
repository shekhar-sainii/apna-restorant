import { Request, Response } from "express";
import menuItemService from "./menuItem.service";
import ApiResponse from "../../utils/ApiResponse";
import asyncHandler from "../../utils/asyncHandler";

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { category, isVeg, isAvailable, search, page, limit } = req.query;

  const filters = {
    category: category ? String(category) : undefined,
    isVeg: isVeg !== undefined ? isVeg === "true" : undefined,
    isAvailable: isAvailable !== undefined ? isAvailable === "true" : undefined,
    search: search ? String(search) : undefined,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  };

  const { items, total } = await menuItemService.getAll(filters);
  return ApiResponse.paginated(res, "Menu items retrieved successfully", items, filters.page, filters.limit, total);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await menuItemService.getById(id);
  return ApiResponse.success(res, "Menu item retrieved successfully", item);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, price, category, isVeg, preparationTime, tags, sortOrder } = req.body;
  const file = req.file;

  const item = await menuItemService.create({
    name,
    description,
    price,
    category,
    isVeg,
    preparationTime,
    tags,
    sortOrder,
    file,
  });

  return ApiResponse.created(res, "Menu item created successfully", item);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const file = req.file;

  const item = await menuItemService.update(id, updates, file);
  return ApiResponse.success(res, "Menu item updated successfully", item);
});

export const toggleAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await menuItemService.toggleAvailability(id);
  return ApiResponse.success(res, "Menu item availability toggled", item);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await menuItemService.delete(id);
  return ApiResponse.success(res, "Menu item deleted successfully", null);
});
