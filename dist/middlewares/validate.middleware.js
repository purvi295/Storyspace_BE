"use strict";
// src/middlewares/validate.middleware.ts
// Reusable validation middleware supporting body, query, and params validation with Joi
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const joi_1 = __importDefault(require("joi"));
const api_error_1 = __importDefault(require("../utils/api.error"));
/**
 * Validates request data against Joi schemas.
 *
 * Can be called in multiple ways:
 * 1. Single schema (defaults to body): validate(myBodySchema)
 * 2. Single schema with explicit source: validate(myQuerySchema, 'query')
 * 3. Multi-target schema map: validate({ body: myBodySchema, query: myQuerySchema, params: myParamsSchema })
 */
const validate = (schemaOrMap, explicitTarget = "body") => {
    return (req, _res, next) => {
        const errorMessages = [];
        // Determine targets and corresponding schemas
        let targetsToValidate = [];
        if (joi_1.default.isSchema(schemaOrMap)) {
            targetsToValidate = [{ target: explicitTarget, schema: schemaOrMap }];
        }
        else {
            const map = schemaOrMap;
            if (map.body)
                targetsToValidate.push({ target: "body", schema: map.body });
            if (map.query)
                targetsToValidate.push({ target: "query", schema: map.query });
            if (map.params)
                targetsToValidate.push({ target: "params", schema: map.params });
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
            }
            else {
                // Assign the validated and type-coerced values back
                try {
                    req[target] = value;
                }
                catch {
                    // Fallback if property setter is restricted
                    Object.keys(req[target]).forEach((k) => delete req[target][k]);
                    Object.assign(req[target], value);
                }
            }
        }
        if (errorMessages.length > 0) {
            return next(api_error_1.default.badRequest("Validation Error", errorMessages));
        }
        return next();
    };
};
exports.validate = validate;
exports.default = exports.validate;
