// src/middlewares/common.validation.ts
// Reusable schemas for pagination, IDs, usernames, and identifiers

import Joi from "joi";

/**
 * Standard pagination query parameters (page, limit)
 */
export const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
  }),
});

/**
 * Numeric path parameter :id (e.g. comment ID)
 */
export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "ID must be a valid number",
    "number.integer": "ID must be an integer",
    "number.positive": "ID must be a positive integer",
    "any.required": "ID path parameter is required",
  }),
});

/**
 * Username path parameter :username
 */
export const usernameParamSchema = Joi.object({
  username: Joi.string()
    .trim()
    .pattern(/^[a-zA-Z0-9_.-]+$/)
    .min(3)
    .max(50)
    .required()
    .messages({
      "string.pattern.base":
        "Username must contain only letters, numbers, underscores, dashes, or dots",
      "string.min": "Username must be at least 3 characters long",
      "string.max": "Username cannot exceed 50 characters",
      "any.required": "Username path parameter is required",
    }),
});

/**
 * Target user identifier (:target - username or user_uuid)
 */
export const targetParamSchema = Joi.object({
  target: Joi.string().trim().min(3).max(100).required().messages({
    "string.empty": "Target user identifier cannot be empty",
    "string.min": "Target user identifier must be at least 3 characters long",
    "string.max": "Target user identifier cannot exceed 100 characters",
    "any.required": "Target user identifier is required",
  }),
});

/**
 * Slug path parameter :slug
 */
export const slugParamSchema = Joi.object({
  slug: Joi.string().trim().min(3).max(300).required().messages({
    "string.empty": "Slug cannot be empty",
    "string.min": "Slug must be at least 3 characters long",
    "string.max": "Slug cannot exceed 300 characters",
    "any.required": "Slug is required",
  }),
});

/**
 * Story identifier path parameter :identifier (slug, UUID, or numeric ID)
 */
export const storyIdentifierParamSchema = Joi.object({
  identifier: Joi.string().trim().min(1).max(300).required().messages({
    "string.empty": "Story identifier cannot be empty",
    "string.min": "Story identifier must be at least 1 character long",
    "string.max": "Story identifier cannot exceed 300 characters",
    "any.required": "Story identifier is required",
  }),
});
