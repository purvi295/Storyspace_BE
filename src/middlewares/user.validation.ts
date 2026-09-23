import Joi from 'joi';

/** Validates the fields a signed-in user may change on their own profile. */
export const updateProfileSchema = Joi.object({
  full_name: Joi.string().trim().min(2).max(150).optional().messages({
    'string.min': 'Full name must be at least 2 characters long',
  }),
  bio: Joi.string().trim().max(500).allow('').optional().messages({
    'string.max': 'Bio cannot exceed 500 characters',
  }),
  avatar_url: Joi.string().trim().uri().max(500).allow('').optional().messages({
    'string.uri': 'Avatar URL must be a valid URL',
    'string.max': 'Avatar URL cannot exceed 500 characters',
  }),
})
  .min(1)
  .messages({
    'object.min': 'Provide at least one field to update',
  });

export default {
  updateProfileSchema,
};
