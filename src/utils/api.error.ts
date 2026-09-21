// src/utils/api.error.ts
// Custom Operational API Error Class

export class ApiError extends Error {
  public statusCode: number;
  public details: any;
  public isOperational: boolean;
  public success: boolean;

  constructor(statusCode: number, message: string, details: any = null, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    this.success = false;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message = 'Bad Request', details: any = null): ApiError {
    return new ApiError(400, message, details);
  }

  static notFound(message = 'Resource Not Found'): ApiError {
    return new ApiError(404, message);
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  static internal(message = 'Internal Server Error'): ApiError {
    return new ApiError(500, message, null, false);
  }
}

export default ApiError;
