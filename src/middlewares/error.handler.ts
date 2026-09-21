// src/middlewares/error.handler.ts
// Centralized Error Handling Middleware for Express

import { Request, Response, NextFunction } from 'express';
import config from '../config/env.config';
import ApiError from '../utils/api.error';

/**
 * Middleware to catch 404 Not Found errors for undefined endpoints.
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Resource not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Global centralized error handler.
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  const details = err.details;

  if (statusCode >= 500) {
    console.error(`💥 [Unhandled Server Error] ${req.method} ${req.originalUrl}:`, err);
  } else {
    console.warn(`⚠️ [Client Error ${statusCode}] ${req.method} ${req.originalUrl}: ${message}`);
  }

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(details && { details }),
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};

export default {
  notFoundHandler,
  errorHandler,
};
