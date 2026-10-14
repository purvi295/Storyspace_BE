import Joi from "joi";

/**
 * Validates request body when adding a new comment.
 */
export const createCommentSchema = Joi.object({
  story_uuid: Joi.string()
    .trim()
    .pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    .required()
    .messages({
      "string.pattern.base": "Invalid UUID format",
      "any.required": "Story UUID is required",
    }),
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
 * Validates comment UUID in path parameters (:comment_uuid).
 */
export const commentUuidParamSchema = Joi.object({
  comment_uuid: Joi.string()
    .trim()
    .pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    .required()
    .messages({
      "string.pattern.base": "Invalid UUID format",
      "any.required": "Comment UUID is required",
    }),
});

export default {
  createCommentSchema,
  updateCommentSchema,
  commentUuidParamSchema,
};
