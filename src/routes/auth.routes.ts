import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import validate from "../middlewares/validate.middleware";
import {
  loginSchema,
  registerSchema,
} from "../middlewares/auth.validation";

const router = Router();

// POST /api/auth/register - Register new user
router.post(
  "/register",
  validate(registerSchema),
  authController.register.bind(authController),
);

// POST /api/auth/login - Login user
router.post(
  "/login",
  validate(loginSchema),
  authController.login.bind(authController),
);

// POST /api/auth/logout - Logout user
router.post(
  "/logout",
  authenticateToken,
  authController.logout.bind(authController),
);

// GET /api/auth/me - Get current authenticated user profile
router.get("/me", authenticateToken, authController.me.bind(authController));

export default router;
