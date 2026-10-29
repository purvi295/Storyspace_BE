// src/middlewares/rate-limiter.middleware.ts
// Rate limiting configurations for protecting endpoints against brute-force attacks and abuse

import rateLimit, { Options } from "express-rate-limit";
import { Request, Response } from "express";
import { sendErrorResponse } from "../utils/api.response";

/**
 * Brute-force protection for authentication endpoints (login, register, password reset).
 * Restricts an IP address to 5 attempts every 15 minutes.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15-minute time window
  max: 50, // Maximum 5 requests allowed per window per IP
  standardHeaders: true, // Return standard RateLimit-* headers in the response
  legacyHeaders: false, // Disable the deprecated X-RateLimit-* headers
  skipSuccessfulRequests: false, // Count all requests to prevent credential stuffing
  handler: (req: Request, res: Response) => {
    return sendErrorResponse(
      res,
      429,
      "Too many login attempts from this IP address. Please try again after 15 minutes.",
    );
  },
});

/**
 * General API rate limiter for standard public endpoints.
 * Allows up to 60 requests per 1-minute window per IP.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 60, // Max 60 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    return sendErrorResponse(
      res,
      429,
      "Too many requests to the API. Please slow down.",
    );
  },
});
