// src/middlewares/validate.middleware.ts
// Reusable validation middleware supporting body, query, and params validation with Joi

import { Request, Response, NextFunction, RequestHandler } from "express";
import Joi, { ObjectSchema, Schema } from "joi";
import ApiError from "../utils/api.error";

export type ValidationTarget = "body" | "query" | "params";

export interface ValidationSchemaMap {
  body?: Schema;
  query?: Schema;
  params?: Schema;
}

/**
 * Validates request data against Joi schemas.
 * 
 * Can be called in multiple ways:
 * 1. Single schema (defaults to body): validate(myBodySchema)
 * 2. Single schema with explicit source: validate(myQuerySchema, 'query')
 * 3. Multi-target schema map: validate({ body: myBodySchema, query: myQuerySchema, params: myParamsSchema })
 */
export const validate = (
  schemaOrMap: Schema | ValidationSchemaMap,
  explicitTarget: ValidationTarget = "body"
): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const errorMessages: string[] = [];

    // Determine targets and corresponding schemas
    let targetsToValidate: { target: ValidationTarget; schema: Schema }[] = [];

    if (Joi.isSchema(schemaOrMap)) {
      targetsToValidate = [{ target: explicitTarget, schema: schemaOrMap as Schema }];
    } else {
      const map = schemaOrMap as ValidationSchemaMap;
      if (map.body) targetsToValidate.push({ target: "body", schema: map.body });
      if (map.query) targetsToValidate.push({ target: "query", schema: map.query });
      if (map.params) targetsToValidate.push({ target: "params", schema: map.params });
    }

    for (const { target, schema } of targetsToValidate) {
      const dataToValidate = req[target] || {};

      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false,
        stripUnknown: target === "body" || target === "query",
        convert: true,
      });

      if (error) {
        for (const detail of error.details) {
          // Clean message to be human friendly
          const cleanMessage = detail.message.replace(/['"]/g, "");
          errorMessages.push(cleanMessage);
        }
      } else {
        // Assign the validated and type-coerced values back
        try {
          (req as any)[target] = value;
        } catch {
          // Fallback if property setter is restricted
          Object.keys(req[target]).forEach((k) => delete (req as any)[target][k]);
          Object.assign((req as any)[target], value);
        }
      }
    }

    if (errorMessages.length > 0) {
      return next(ApiError.badRequest("Validation Error", errorMessages));
    }

    return next();
  };
};

export default validate;
