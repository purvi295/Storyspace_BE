import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import validate from "../middlewares/validate.middleware";
import { updateProfileSchema } from "../middlewares/user.validation";

const router = Router();

// GET /api/users/list - Get all user list with pagination
router.get("/list", userController.getAllUsersList.bind(userController));

// PUT /api/users/profile - Update own profile (bio, avatar, name)
router.put(
  "/profile",
  authenticateToken,
  validate(updateProfileSchema),
  userController.updateProfile.bind(userController)
);

// ==========================================
// Follow / Following Routes
// ==========================================

// POST /api/users/:target/follow - Follow user (target: user_uuid or username)
router.post(
  "/:target/follow",
  authenticateToken,
  userController.followUser.bind(userController)
);

// DELETE /api/users/:target/follow - Unfollow user
router.delete(
  "/:target/follow",
  authenticateToken,
  userController.unfollowUser.bind(userController)
);

// GET /api/users/:target/followers - List followers
router.get(
  "/:target/followers",
  userController.getFollowers.bind(userController)
);

// GET /api/users/:target/following - List followed users
router.get(
  "/:target/following",
  userController.getFollowing.bind(userController)
);

// GET /api/users/:target/is-following - Check if authenticated user follows target
router.get(
  "/:target/is-following",
  authenticateToken,
  userController.isFollowing.bind(userController)
);

// GET /api/users/:username - Public profile + follower/following counts
router.get("/:username", userController.getPublicProfile.bind(userController));

export default router;
