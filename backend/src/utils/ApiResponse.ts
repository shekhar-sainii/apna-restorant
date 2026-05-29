import { Response } from "express";

class ApiResponse<T = any> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  meta?: any;

  constructor(statusCode: number, message: string, data?: T, meta?: any) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    if (data !== undefined) this.data = data;
    if (meta !== undefined) this.meta = meta;
  }

  static success<T>(res: Response, message: string, data: T, statusCode = 200, meta: any = null): Response {
    return res.status(statusCode).json(new ApiResponse(statusCode, message, data, meta));
  }

  static created<T>(res: Response, message: string, data: T): Response {
    return ApiResponse.success(res, message, data, 201);
  }

  static paginated<T>(res: Response, message: string, data: T, page: number, limit: number, total: number): Response {
    const meta = {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
    };
    return ApiResponse.success(res, message, data, 200, meta);
  }
}

export default ApiResponse;
