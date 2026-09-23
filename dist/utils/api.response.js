"use strict";
// src/utils/api.response.ts
// Standardized API response format for all outgoing HTTP responses
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaginatedResponse = exports.sendErrorResponse = exports.sendApiResponse = exports.ApiResponse = void 0;
class ApiResponse {
    success;
    statusCode;
    message;
    data;
    meta;
    constructor(statusCode, data = null, message = 'Success', meta = null) {
        this.success = statusCode >= 200 && statusCode < 300;
        this.statusCode = statusCode;
        this.message = message;
        if (data !== null && data !== undefined) {
            this.data = data;
        }
        if (meta) {
            this.meta = meta;
        }
    }
    send(res) {
        return res.status(this.statusCode).json(this);
    }
}
exports.ApiResponse = ApiResponse;
/** Send the standard successful API response shape. */
const sendApiResponse = (res, statusCode, data, message = 'Success') => new ApiResponse(statusCode, data, message).send(res);
exports.sendApiResponse = sendApiResponse;
/** Send the standard error response shape used by the global error handler. */
const sendErrorResponse = (res, statusCode, message, details) => res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(details !== undefined && { details }),
});
exports.sendErrorResponse = sendErrorResponse;
/** Send a standard response with pagination information in `meta`. */
const sendPaginatedResponse = (res, data, pagination, message = 'Success', statusCode = 200) => new ApiResponse(statusCode, data, message, pagination).send(res);
exports.sendPaginatedResponse = sendPaginatedResponse;
exports.default = ApiResponse;
