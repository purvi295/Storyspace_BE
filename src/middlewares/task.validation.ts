// src/middlewares/task.validation.ts
// Defines validation schemas for Task operations using Joi

import Joi from 'joi';

// Schema for POST /api/tasks (Creating a new task)
export const createTaskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100).required().messages({
    'string.base': 'Title must be a string',
    'string.empty': 'Title cannot be empty',
    'string.min': 'Title must be at least 3 characters long',
    'string.max': 'Title cannot exceed 100 characters',
    'any.required': 'Title is a required field',
  }),
  description: Joi.string().trim().max(500).allow('').optional().messages({
    'string.max': 'Description cannot exceed 500 characters',
  }),
  status: Joi.string()
    .valid('pending', 'in-progress', 'completed')
    .default('pending')
    .messages({
      'any.only': 'Status must be one of: pending, in-progress, completed',
    }),
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .default('medium')
    .messages({
      'any.only': 'Priority must be one of: low, medium, high',
    }),
});

// Schema for PUT /api/tasks/:id (Updating an existing task)
export const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100).optional(),
  description: Joi.string().trim().max(500).allow('').optional(),
  status: Joi.string().valid('pending', 'in-progress', 'completed').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
})
  .min(1)
  .messages({
    'object.min': 'At least one field (title, description, status, priority) must be provided for update',
  });

export default {
  createTaskSchema,
  updateTaskSchema,
};
