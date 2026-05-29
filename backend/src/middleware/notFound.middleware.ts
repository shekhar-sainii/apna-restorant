import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Route not found - ${req.originalUrl}`));
};
