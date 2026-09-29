import Joi from "joi";

/**
 * Validates requests to create a public user account.
 * Supports both `full_name` format.
 */
export const registerSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(100).required().messages({
    "string.email": "Email must be a valid email address (e.g. user@example.com)",
    "string.empty": "Email cannot be empty",
    "string.max": "Email cannot exceed 100 characters",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(8).max(50).required().messages({
    "string.empty": "Password cannot be empty",
    "string.min": "Password must be at least 8 characters long",
    "string.max": "Password cannot exceed 50 characters",
    "any.required": "Password is required",
  }),
  username: Joi.string()
    .trim()
    .pattern(/^[a-zA-Z0-9_.-]+$/)
    .min(3)
    .max(50)
    .required()
    .messages({
      "string.pattern.base":
        "Username can only contain letters, numbers, underscores (_), hyphens (-), and periods (.)",
      "string.empty": "Username cannot be empty",
      "string.min": "Username must be at least 3 characters long",
      "string.max": "Username cannot exceed 50 characters",
      "any.required": "Username is required",
    }),

  full_name: Joi.string().trim().min(2).max(150).optional().messages({
    "string.min": "Full name must be at least 2 characters long",
    "string.max": "Full name cannot exceed 150 characters",
    "string.empty": "Full name cannot be empty",
  }),
})
  .or("full_name")
  .messages({
    "object.missing": "full name is required",
  });

/**
 * Validates credentials submitted to log in.
 */
export const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(100).required().messages({
    "string.email": "Email must be a valid email address",
    "string.empty": "Email cannot be empty",
    "string.max": "Email cannot exceed 100 characters",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(8).max(50).required().messages({
    "string.empty": "Password cannot be empty",
    "string.min": "Password must be at least 8 characters long",
    "string.max": "Password cannot exceed 50 characters",
    "any.required": "Password is required",
  }),
});

/**
 * Validates profile edits made through the auth routes.
 */
export const editProfileSchema = Joi.object({
  full_name: Joi.string().trim().min(2).max(150).optional().messages({
    "string.min": "Full name must be at least 2 characters long",
    "string.max": "Full name cannot exceed 150 characters",
    "string.empty": "Full name cannot be empty",
  }),
  bio: Joi.string().trim().max(500).allow("").optional().messages({
    "string.max": "Bio cannot exceed 500 characters",
  }),
  avatar_url: Joi.string().trim().uri().max(500).allow("").optional().messages({
    "string.uri": "Avatar URL must be a valid URI (e.g. https://example.com/avatar.png)",
    "string.max": "Avatar URL cannot exceed 500 characters",
  }),
  username: Joi.string()
    .trim()
    .pattern(/^[a-zA-Z0-9_.-]+$/)
    .min(3)
    .max(50)
    .optional()
    .messages({
      "string.pattern.base":
        "Username can only contain letters, numbers, underscores (_), hyphens (-), and periods (.)",
      "string.min": "Username must be at least 3 characters long",
      "string.max": "Username cannot exceed 50 characters",
      "string.empty": "Username cannot be empty",
    }),
})
  .min(1)
  .messages({
    "object.min": "Please provide at least one field to update",
  });

export default {
  registerSchema,
  loginSchema,
  editProfileSchema,
};
