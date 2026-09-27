import Joi from "joi";

/**
 * Validates request body when adding a new comment.
 */
export const createCommentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required().messages({
    "string.empty": "Comment content cannot be empty",
    "string.min": "Comment content must be at least 1 character long",
    "string.max": "Comment content cannot exceed 2000 characters",
    "any.required": "Comment content is required",
  }),
});

/**
 * Validates request body when updating an existing comment.
 */
export const updateCommentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required().messages({
    "string.empty": "Comment content cannot be empty",
    "string.min": "Comment content must be at least 1 character long",
    "string.max": "Comment content cannot exceed 2000 characters",
    "any.required": "Comment content is required",
  }),
});

/**
 * Validates numeric comment ID in path parameters (:id).
 */
export const commentIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Comment ID must be a number",
    "number.integer": "Comment ID must be an integer",
    "number.positive": "Comment ID must be a positive integer",
    "any.required": "Comment ID is required",
  }),
});

export default {
  createCommentSchema,
  updateCommentSchema,
  commentIdParamSchema,
};
