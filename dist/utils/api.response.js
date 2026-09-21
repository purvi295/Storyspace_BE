"use strict";
// src/utils/api.response.ts
// Standardized API response format for all outgoing HTTP responses
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
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
exports.default = ApiResponse;
