"use strict";
// src/utils/api.error.ts
// Custom Operational API Error Class
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
class ApiError extends Error {
    statusCode;
    details;
    isOperational;
    success;
    constructor(statusCode, message, details = null, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = isOperational;
        this.success = false;
    }
    static badRequest(message = "Bad Request", details = null) {
        return new ApiError(400, message, details);
    }
    static notFound(message = "Resource Not Found") {
        return new ApiError(404, message);
    }
    static unauthorized(message = "Unauthorized") {
        return new ApiError(401, message);
    }
    static forbidden(message = "Forbidden") {
        return new ApiError(403, message);
    }
    static internal(message = "Internal Server Error") {
        return new ApiError(500, message, null, false);
    }
}
exports.ApiError = ApiError;
exports.default = ApiError;
