// src/utils/api.error.ts
// Custom Operational API Error Class

export interface ErrorDetails {
  [key: string]: unknown;
}

export interface AppError extends Error {
  statusCode?: number;
  details?: ErrorDetails;
  isOperational?: boolean;
  success?: boolean;
}

export class ApiError extends Error {
  public statusCode: number;
  public details: ErrorDetails;
  public isOperational: boolean;
  public success: boolean;

  constructor(
    statusCode: number,
    message: string,
    details: ErrorDetails = {},
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    this.success = false;
  }

  static badRequest(message = "Bad Request", details: ErrorDetails = {}): ApiError {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "Unauthorized"): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden"): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message = "Not Found"): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message = "Conflict", details: ErrorDetails = {}): ApiError {
    return new ApiError(409, message, details);
  }

  static internal(message = "Internal Server Error"): ApiError {
    return new ApiError(500, message, {}, false);
  }
}

export default ApiError;
