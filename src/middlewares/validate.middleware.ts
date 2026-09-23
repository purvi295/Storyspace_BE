// src/middlewares/validate.middleware.ts
// Reusable validation middleware using Joi & ApiError

import { Request, Response, NextFunction, RequestHandler } from "express";
import { ObjectSchema } from "joi";
import ApiError from "../utils/api.error";

export const validate = (schema: ObjectSchema): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return next(ApiError.badRequest("Validation Error", errorMessages));
    }

    req.body = value;
    next();
  };
};

export default validate;
