import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/api.error";
import { ROLES } from "../config/constants";

/**
 * Middleware factory requiring user to have one of the allowed roles.
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden("You do not have permission to perform this action")
      );
    }

    next();
  };
};

/**
 * Middleware requiring admin role.
 */
export const requireAdmin = requireRole(ROLES.ADMIN);
