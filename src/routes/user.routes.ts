import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import validate from "../middlewares/validate.middleware";
import { updateProfileSchema } from "../middlewares/user.validation";

const router = Router();

//GET /api/users/list - Get the all user list with the user role and with pagiantion
router.get("/list", userController.getAllUsersList.bind(userController));

// GET /api/users/:username - Public profile + follower/following counts
router.get("/:username", userController.getPublicProfile.bind(userController));

// PUT /api/users/profile - Update own profile (bio, avatar, name)
router.put(
  "/profile",
  authenticateToken,
  validate(updateProfileSchema),
  userController.updateProfile.bind(userController),
);

export default router;
