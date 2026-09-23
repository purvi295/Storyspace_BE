import Joi from "joi";
import { STORY_STATUS, STORY_VISIBILITY } from "../config/constants";

export const createStorySchema = Joi.object({
  title: Joi.string().min(10).required().messages({
    "string.min": "Title must be at least 10 characters long",
    "any.required": "Title is required",
  }),
  content: Joi.string().min(100).required().messages({
    "string.min": "Content must be at least 100 characters long",
    "any.required": "Content is required",
  }),
  slug: Joi.string().min(3).max(300).optional().messages({
    "string.min": "Slug must be at least 3 characters long",
    "string.max": "Slug must be at most 300 characters long",
  }),
  summary: Joi.string().min(10).max(500).optional().messages({
    "string.min": "Summary must be at least 10 characters long",
    "string.max": "Summary must be at most 500 characters long",
  }),
  coverImageUrl: Joi.string().uri().optional(),
  status: Joi.string()
    .valid(...Object.values(STORY_STATUS))
    .optional()
    .messages({
      "any.only": `Status must be one of ${Object.values(STORY_STATUS).join(
        ", ",
      )}`,
    }),
  visibility: Joi.string()
    .valid(...Object.values(STORY_VISIBILITY))
    .optional()
    .messages({
      "any.only": `Visibility must be one of ${Object.values(
        STORY_VISIBILITY,
      ).join(", ")}`,
    }),
});

export const updateStorySchema = Joi.object({
  title: Joi.string().min(10).optional().messages({
    "string.min": "Title must be at least 10 characters long",
  }),
  content: Joi.string().min(100).optional().messages({
    "string.min": "Content must be at least 100 characters long",
  }),
  summary: Joi.string().min(10).max(500).optional().messages({
    "string.min": "Summary must be at least 10 characters long",
    "string.max": "Summary must be at most 500 characters long",
  }),
  coverImageUrl: Joi.string().uri().optional(),
  status: Joi.string()
    .valid(...Object.values(STORY_STATUS))
    .optional()
    .messages({
      "any.only": `Status must be one of ${Object.values(STORY_STATUS).join(
        ", ",
      )}`,
    }),
  visibility: Joi.string()
    .valid(...Object.values(STORY_VISIBILITY))
    .optional()
    .messages({
      "any.only": `Visibility must be one of ${Object.values(
        STORY_VISIBILITY,
      ).join(", ")}`,
    }),
});

export const storyQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  status: Joi.string()
    .valid(...Object.values(STORY_STATUS))
    .optional()
    .messages({
      "any.only": `Status must be one of ${Object.values(STORY_STATUS).join(
        ", ",
      )}`,
    }),
  visibility: Joi.string()
    .valid(...Object.values(STORY_VISIBILITY))
    .optional()
    .messages({
      "any.only": `Visibility must be one of ${Object.values(
        STORY_VISIBILITY,
      ).join(", ")}`,
    }),
  author: Joi.string().optional(),
});
