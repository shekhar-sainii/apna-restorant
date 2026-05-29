import { Request, Response } from "express";
import tableService from "./table.service";
import ApiResponse from "../../utils/ApiResponse";
import asyncHandler from "../../utils/asyncHandler";

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const tables = await tableService.getAll();
  return ApiResponse.success(res, "Tables retrieved", tables);
});

export const getByNumber = asyncHandler(async (req: Request, res: Response) => {
  const tableNumber = parseInt(req.params.tableNumber, 10);
  if (Number.isNaN(tableNumber)) {
    return ApiResponse.success(res, "Invalid table number", null);
  }
  const table = await tableService.getByTableNumber(tableNumber);
  return ApiResponse.success(res, "Table found", table);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const table = await tableService.create(req.body);
  return ApiResponse.created(res, "Table created", table);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const table = await tableService.update(req.params.id, req.body);
  return ApiResponse.success(res, "Table updated", table);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const table = await tableService.delete(req.params.id);
  return ApiResponse.success(res, "Table deleted", table);
});
