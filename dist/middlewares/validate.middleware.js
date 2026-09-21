"use strict";
// src/middlewares/validate.middleware.ts
// Reusable validation middleware using Joi & ApiError
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const api_error_1 = __importDefault(require("../utils/api.error"));
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            const errorMessages = error.details.map((detail) => detail.message);
            return next(api_error_1.default.badRequest('Validation Error', errorMessages));
        }
        req.body = value;
        next();
    };
};
exports.validate = validate;
exports.default = exports.validate;
