// src/middlewares/error.handler.ts
// Centralized Error Handling Middleware for Express

import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/api.error";

/**
 * Middleware to catch 404 Not Found errors for undefined endpoints.
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  next(
    ApiError.notFound(`Resource not found: ${req.method} ${req.originalUrl}`)
  );
};

/**
 * Global centralized error handler.
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";
  const details = err.details;

  // Handle malformed JSON body errors from express.json()
  if (err instanceof SyntaxError && "body" in err) {
    statusCode = 400;
    message = "Malformed JSON payload in request body";
  }

  // Handle PostgreSQL / TypeORM unique violation code 23505
  if (err.code === "23505") {
    statusCode = 409;
    message = "A resource with this identifier or unique attribute already exists";
  }

  if (statusCode >= 500) {
    console.error(
      `💥 [Unhandled Server Error] ${req.method} ${req.originalUrl}:`,
      err
    );
  } else {
    console.warn(
      `⚠️ [Client Error ${statusCode}] ${req.method} ${req.originalUrl}: ${message}`
    );
  }

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(details && { details }),
  });
};

export default {
  notFoundHandler,
  errorHandler,
};
