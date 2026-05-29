class ApiError extends Error {
  statusCode: number;
  success: boolean;
  errors: any[];
  code: string;

  constructor(statusCode: number, message: string, errors: any[] = [], stack = "") {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.code = ApiError.getCode(statusCode);

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static getCode(statusCode: number): string {
    const codes: Record<number, string> = {
      400: "BAD_REQUEST",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      422: "UNPROCESSABLE",
      429: "RATE_LIMITED",
      500: "INTERNAL_ERROR",
    };
    return codes[statusCode] || "ERROR";
  }

  static badRequest(message: string, errors: any[] = []): ApiError {
    return new ApiError(400, message, errors);
  }
  static unauthorized(message = "Unauthorized"): ApiError {
    return new ApiError(401, message);
  }
  static forbidden(message = "Access denied"): ApiError {
    return new ApiError(403, message);
  }
  static notFound(message = "Resource not found"): ApiError {
    return new ApiError(404, message);
  }
  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }
  static internal(message = "Internal server error"): ApiError {
    return new ApiError(500, message);
  }
}

export default ApiError;
