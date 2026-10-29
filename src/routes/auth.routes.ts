// src/routes/auth.routes.ts
// Express routes for authentication, token rotation, and sessions

import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import validate from "../middlewares/validate.middleware";
import {
  loginSchema,
  registerSchema,
  refreshSchema,
} from "../middlewares/auth.validation";
import { loginRateLimiter } from "../middlewares/rate-limiter.middleware";

const router = Router();

// POST /api/auth/register - Register new user
router.post(
  "/register",
  validate(registerSchema),
  authController.register.bind(authController),
);

// POST /api/auth/login - Login user with brute-force rate limiter
router.post(
  "/login",
  loginRateLimiter,
  validate(loginSchema),
  authController.login.bind(authController),
);

// POST /api/auth/refresh - Refresh access token using refresh token (Token Rotation)
router.post(
  "/refresh",
  validate(refreshSchema),
  authController.refresh.bind(authController),
);

// POST /api/auth/logout - Logout user and revoke tokens
router.post(
  "/logout",
  authenticateToken,
  authController.logout.bind(authController),
);

// GET /api/auth/me - Get current authenticated user profile
router.get("/me", authenticateToken, authController.me.bind(authController));

export default router;
