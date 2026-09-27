import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import validate from "../middlewares/validate.middleware";
import {
  updateProfileSchema,
  userListQuerySchema,
  usernameParamSchema,
  targetParamSchema,
  followPaginationQuerySchema,
} from "../middlewares/user.validation";

const router = Router();

// GET /api/users/list - Get all user list with pagination
router.get(
  "/list",
  validate({ query: userListQuerySchema }),
  userController.getAllUsersList.bind(userController)
);

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
  validate({ params: targetParamSchema }),
  userController.followUser.bind(userController)
);

// DELETE /api/users/:target/follow - Unfollow user
router.delete(
  "/:target/follow",
  authenticateToken,
  validate({ params: targetParamSchema }),
  userController.unfollowUser.bind(userController)
);

// GET /api/users/:target/followers - List followers
router.get(
  "/:target/followers",
  validate({
    params: targetParamSchema,
    query: followPaginationQuerySchema,
  }),
  userController.getFollowers.bind(userController)
);

// GET /api/users/:target/following - List followed users
router.get(
  "/:target/following",
  validate({
    params: targetParamSchema,
    query: followPaginationQuerySchema,
  }),
  userController.getFollowing.bind(userController)
);

// GET /api/users/:target/is-following - Check if authenticated user follows target
router.get(
  "/:target/is-following",
  authenticateToken,
  validate({ params: targetParamSchema }),
  userController.isFollowing.bind(userController)
);

// GET /api/users/:username - Public profile + follower/following counts
router.get(
  "/:username",
  validate({ params: usernameParamSchema }),
  userController.getPublicProfile.bind(userController)
);

export default router;
