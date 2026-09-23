import Joi from "joi";

export const createCommentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required().messages({
    "string.empty": "Comment content cannot be empty",
    "string.min": "Comment content must be at least 1 character long",
    "string.max": "Comment content cannot exceed 2000 characters",
    "any.required": "Comment content is required",
  }),
});

export const updateCommentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required().messages({
    "string.empty": "Comment content cannot be empty",
    "string.min": "Comment content must be at least 1 character long",
    "string.max": "Comment content cannot exceed 2000 characters",
    "any.required": "Comment content is required",
  }),
});
