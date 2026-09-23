import Joi from "joi";

/** Validates requests to create a public user account. */
export const registerSchema = Joi.object({
  email: Joi.string().trim().email().max(100).required().messages({
    "string.email": "Email must be a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(8).max(128).required().messages({
    "string.min": "Password must be at least 8 characters long",
    "any.required": "Password is required",
  }),
  username: Joi.string().trim().alphanum().min(3).max(50).required().messages({
    "string.alphanum": "Username must use the letters and numbers only",
    "string.min": "Username must be at least 3 characters long",
    "any.required": "Username is required",
  }),
  fullName: Joi.string().trim().min(2).max(150).required().messages({
    "string.min": "Full name must be at least 2 characters long",
    "any.required": "Full name is required",
  }),
});

/** Validates credentials submitted to log in. */
export const loginSchema = Joi.object({
  email: Joi.string().trim().email().max(100).required().messages({
    "string.email": "Email must be a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

/** Validates profile edits made through the auth routes. */
export const editProfileSchema = Joi.object({
  full_name: Joi.string().trim().min(2).max(150).optional(),
  bio: Joi.string().trim().max(500).allow('').optional(),
  avatar_url: Joi.string().trim().uri().max(500).allow('').optional(),
  username: Joi.string().trim().alphanum().min(3).max(50).optional(),
})
  .min(1)
  .messages({
    'object.min': 'Provide at least one field to update',
  });

export default {
  registerSchema,
  loginSchema,
  editProfileSchema,
};
