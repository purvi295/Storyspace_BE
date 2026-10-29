import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { uploadOptionalImage } from "../middlewares/upload.middleware";
import validate from "../middlewares/validate.middleware";
import {
  updateProfileSchema,
  userListQuerySchema,
  usernameParamSchema,
  followPaginationQuerySchema,
  userUuidBodySchema,
  isFollowingQuerySchema,
} from "../middlewares/user.validation";
import { userUuidParamSchema } from "../middlewares/common.validation";

const router = Router();

// GET /api/users/list - Get all user list with pagination
router.get(
  "/list",
  validate({ query: userListQuerySchema }),
  userController.getAllUsersList.bind(userController),
);

// PUT /api/users/profile - Update own profile (bio, avatar, name)
router.put(
  "/profile",
  authenticateToken,
  uploadOptionalImage,
  validate(updateProfileSchema),
  userController.updateProfile.bind(userController),
);

// ==========================================
// Follow / Following Routes
// ==========================================

// POST /api/users/follow - Follow user
router.post(
  "/follow",
  authenticateToken,
  validate({ body: userUuidBodySchema }),
  userController.followUser.bind(userController),
);

// DELETE /api/users/follow - Unfollow user
router.delete(
  "/follow",
  authenticateToken,
  validate({ body: userUuidBodySchema }),
  userController.unfollowUser.bind(userController),
);

// GET /api/users/followers - Get user's followers
router.get(
  "/followers",
  validate({
    query: followPaginationQuerySchema,
  }),
  userController.getFollowers.bind(userController),
);

// GET /api/users/following - Get users followed by user
router.get(
  "/following",
  validate({
    query: followPaginationQuerySchema,
  }),
  userController.getFollowing.bind(userController),
);

// GET /api/users/is-following - Check if authenticated user follows target
router.get(
  "/is-following",
  authenticateToken,
  validate({ query: isFollowingQuerySchema }),
  userController.isFollowing.bind(userController),
);

// GET /api/users/:username - Public profile + follower/following counts
router.get(
  "/:user_uuid",
  validate({ params: userUuidParamSchema }),
  userController.getPublicProfile.bind(userController),
);

export default router;
