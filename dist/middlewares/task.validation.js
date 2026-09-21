"use strict";
// src/middlewares/task.validation.ts
// Defines validation schemas for Task operations using Joi
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTaskSchema = exports.createTaskSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// Schema for POST /api/tasks (Creating a new task)
exports.createTaskSchema = joi_1.default.object({
    title: joi_1.default.string().trim().min(3).max(100).required().messages({
        'string.base': 'Title must be a string',
        'string.empty': 'Title cannot be empty',
        'string.min': 'Title must be at least 3 characters long',
        'string.max': 'Title cannot exceed 100 characters',
        'any.required': 'Title is a required field',
    }),
    description: joi_1.default.string().trim().max(500).allow('').optional().messages({
        'string.max': 'Description cannot exceed 500 characters',
    }),
    status: joi_1.default.string()
        .valid('pending', 'in-progress', 'completed')
        .default('pending')
        .messages({
        'any.only': 'Status must be one of: pending, in-progress, completed',
    }),
    priority: joi_1.default.string()
        .valid('low', 'medium', 'high')
        .default('medium')
        .messages({
        'any.only': 'Priority must be one of: low, medium, high',
    }),
});
// Schema for PUT /api/tasks/:id (Updating an existing task)
exports.updateTaskSchema = joi_1.default.object({
    title: joi_1.default.string().trim().min(3).max(100).optional(),
    description: joi_1.default.string().trim().max(500).allow('').optional(),
    status: joi_1.default.string().valid('pending', 'in-progress', 'completed').optional(),
    priority: joi_1.default.string().valid('low', 'medium', 'high').optional(),
})
    .min(1)
    .messages({
    'object.min': 'At least one field (title, description, status, priority) must be provided for update',
});
exports.default = {
    createTaskSchema: exports.createTaskSchema,
    updateTaskSchema: exports.updateTaskSchema,
};
