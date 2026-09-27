"use strict";
// src/middlewares/error.handler.ts
// Centralized Error Handling Middleware for Express
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = void 0;
const api_error_1 = __importDefault(require("../utils/api.error"));
/**
 * Middleware to catch 404 Not Found errors for undefined endpoints.
 */
const notFoundHandler = (req, _res, next) => {
    next(api_error_1.default.notFound(`Resource not found: ${req.method} ${req.originalUrl}`));
};
exports.notFoundHandler = notFoundHandler;
/**
 * Global centralized error handler.
 */
const errorHandler = (err, req, res, _next) => {
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
        console.error(`💥 [Unhandled Server Error] ${req.method} ${req.originalUrl}:`, err);
    }
    else {
        console.warn(`⚠️ [Client Error ${statusCode}] ${req.method} ${req.originalUrl}: ${message}`);
    }
    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        ...(details && { details }),
    });
};
exports.errorHandler = errorHandler;
exports.default = {
    notFoundHandler: exports.notFoundHandler,
    errorHandler: exports.errorHandler,
};
