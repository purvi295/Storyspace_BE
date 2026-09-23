import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import validate from "../middlewares/validate.middleware";
import {
  loginSchema,
  registerSchema,
  editProfileSchema,
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

// GET /api/auth/me - Get current authenticated user profile
router.get("/me", authenticateToken, authController.me.bind(authController));

// POST /api/auth/edit-profile - Update user profile
router.post(
  "/edit-profile",
  authenticateToken,
  validate(editProfileSchema),
  authController.editProfile.bind(authController),
);

export default router;
