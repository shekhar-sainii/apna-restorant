import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import ApiError from "../utils/ApiError";

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e: any) => ({
      field: e.path,
      message: e.msg,
    }));
    throw ApiError.badRequest("Validation failed", formatted);
  }
  next();
};
