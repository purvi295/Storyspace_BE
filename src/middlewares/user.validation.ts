import Joi from "joi";

/**
 * Validates the fields a signed-in user may change on their own profile.
 */
export const updateProfileSchema = Joi.object({
  full_name: Joi.string().trim().min(2).max(150).optional().messages({
    "string.min": "Full name must be at least 2 characters long",
    "string.max": "Full name cannot exceed 150 characters",
    "string.empty": "Full name cannot be empty",
  }),
  bio: Joi.string().trim().max(500).allow("").optional().messages({
    "string.max": "Bio cannot exceed 500 characters",
  }),
  avatar_url: Joi.string().trim().uri().max(500).allow("").optional().messages({
    "string.uri": "Avatar URL must be a valid URL (e.g. https://...)",
    "string.max": "Avatar URL cannot exceed 500 characters",
  }),
})
  .min(1)
  .messages({
    "object.min": "Provide at least one field to update",
  });

/**
 * Validates query parameters for listing all users.
 */
export const userListQuerySchema = Joi.object({
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
  search: Joi.string().trim().max(100).optional(),
});

/**
 * Validates the path parameter :username for public profile lookup.
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
      "string.empty": "Username cannot be empty",
      "any.required": "Username path parameter is required",
    }),
});

/**
 * Validates the path parameter :target (accepts username or UUID).
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
 * Validates pagination query parameters for followers/following lists.
 */
export const followPaginationQuerySchema = Joi.object({
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

export default {
  updateProfileSchema,
  userListQuerySchema,
  usernameParamSchema,
  targetParamSchema,
  followPaginationQuerySchema,
};
