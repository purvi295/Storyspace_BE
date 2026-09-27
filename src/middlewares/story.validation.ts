import Joi from "joi";
import { STORY_STATUS, STORY_VISIBILITY } from "../config/constants";

/**
 * Validates request body when creating a story.
 */
export const createStorySchema = Joi.object({
  title: Joi.string().trim().min(10).max(255).required().messages({
    "string.empty": "Title cannot be empty",
    "string.min": "Title must be at least 10 characters long",
    "string.max": "Title cannot exceed 255 characters",
    "any.required": "Title is required",
  }),
  content: Joi.string().min(100).required().messages({
    "string.empty": "Content cannot be empty",
    "string.min": "Content must be at least 100 characters long",
    "any.required": "Content is required",
  }),
  slug: Joi.string()
    .trim()
    .min(3)
    .max(300)
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .optional()
    .messages({
      "string.min": "Slug must be at least 3 characters long",
      "string.max": "Slug must be at most 300 characters long",
      "string.pattern.base": "Slug may only contain letters, numbers, hyphens, and underscores",
    }),
  summary: Joi.string().trim().min(10).max(500).allow("").optional().messages({
    "string.min": "Summary must be at least 10 characters long",
    "string.max": "Summary must be at most 500 characters long",
  }),
  coverImageUrl: Joi.string().trim().uri().max(500).allow("").optional().messages({
    "string.uri": "Cover image URL must be a valid URI (e.g. https://...)",
    "string.max": "Cover image URL cannot exceed 500 characters",
  }),
  status: Joi.string()
    .valid(...Object.values(STORY_STATUS))
    .optional()
    .messages({
      "any.only": `Status must be one of: ${Object.values(STORY_STATUS).join(", ")}`,
    }),
  visibility: Joi.string()
    .valid(...Object.values(STORY_VISIBILITY))
    .optional()
    .messages({
      "any.only": `Visibility must be one of: ${Object.values(STORY_VISIBILITY).join(", ")}`,
    }),
});

/**
 * Validates request body when updating a story.
 */
export const updateStorySchema = Joi.object({
  title: Joi.string().trim().min(10).max(255).optional().messages({
    "string.empty": "Title cannot be empty",
    "string.min": "Title must be at least 10 characters long",
    "string.max": "Title cannot exceed 255 characters",
  }),
  content: Joi.string().min(100).optional().messages({
    "string.empty": "Content cannot be empty",
    "string.min": "Content must be at least 100 characters long",
  }),
  summary: Joi.string().trim().min(10).max(500).allow("").optional().messages({
    "string.min": "Summary must be at least 10 characters long",
    "string.max": "Summary must be at most 500 characters long",
  }),
  coverImageUrl: Joi.string().trim().uri().max(500).allow("").optional().messages({
    "string.uri": "Cover image URL must be a valid URI (e.g. https://...)",
    "string.max": "Cover image URL cannot exceed 500 characters",
  }),
  status: Joi.string()
    .valid(...Object.values(STORY_STATUS))
    .optional()
    .messages({
      "any.only": `Status must be one of: ${Object.values(STORY_STATUS).join(", ")}`,
    }),
  visibility: Joi.string()
    .valid(...Object.values(STORY_VISIBILITY))
    .optional()
    .messages({
      "any.only": `Visibility must be one of: ${Object.values(STORY_VISIBILITY).join(", ")}`,
    }),
  slug: Joi.string()
    .trim()
    .min(3)
    .max(300)
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .optional()
    .messages({
      "string.min": "Slug must be at least 3 characters long",
      "string.max": "Slug must be at most 300 characters long",
      "string.pattern.base": "Slug may only contain letters, numbers, hyphens, and underscores",
    }),
})
  .min(1)
  .messages({
    "object.min": "Provide at least one field to update",
  });

/**
 * Validates slug path parameter :slug.
 */
export const storySlugParamSchema = Joi.object({
  slug: Joi.string().trim().min(3).max(300).required().messages({
    "string.empty": "Story slug cannot be empty",
    "string.min": "Story slug must be at least 3 characters long",
    "string.max": "Story slug cannot exceed 300 characters",
    "any.required": "Story slug is required",
  }),
});

/**
 * Validates story identifier path parameter :identifier (slug, UUID, or numeric ID).
 */
export const storyIdentifierParamSchema = Joi.object({
  identifier: Joi.string().trim().min(1).max(300).required().messages({
    "string.empty": "Story identifier cannot be empty",
    "string.min": "Story identifier must be at least 1 character long",
    "string.max": "Story identifier cannot exceed 300 characters",
    "any.required": "Story identifier is required",
  }),
});

/**
 * Validates query parameters for public stories.
 */
export const publicStoriesQuerySchema = Joi.object({
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
 * Validates query parameters for user stories.
 */
export const userStoriesQuerySchema = Joi.object({
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
  status: Joi.string()
    .valid(...Object.values(STORY_STATUS))
    .optional()
    .messages({
      "any.only": `Status must be one of: ${Object.values(STORY_STATUS).join(", ")}`,
    }),
});

/**
 * Validates query parameters for user's own stories ("my stories").
 */
export const myStoriesQuerySchema = Joi.object({
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
  status: Joi.string()
    .valid(...Object.values(STORY_STATUS))
    .optional()
    .messages({
      "any.only": `Status must be one of: ${Object.values(STORY_STATUS).join(", ")}`,
    }),
});

/**
 * Validates query parameters for all stories filter endpoint.
 */
export const allStoriesQuerySchema = Joi.object({
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
  status: Joi.string()
    .valid(...Object.values(STORY_STATUS))
    .optional()
    .messages({
      "any.only": `Status must be one of: ${Object.values(STORY_STATUS).join(", ")}`,
    }),
  visibility: Joi.string()
    .valid(...Object.values(STORY_VISIBILITY))
    .optional()
    .messages({
      "any.only": `Visibility must be one of: ${Object.values(STORY_VISIBILITY).join(", ")}`,
    }),
  author: Joi.string().trim().min(1).max(100).optional(),
});

/**
 * Validates query parameters for story likes/comments pagination.
 */
export const storyInteractionQuerySchema = Joi.object({
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
  createStorySchema,
  updateStorySchema,
  storySlugParamSchema,
  storyIdentifierParamSchema,
  publicStoriesQuerySchema,
  userStoriesQuerySchema,
  myStoriesQuerySchema,
  allStoriesQuerySchema,
  storyInteractionQuerySchema,
};
