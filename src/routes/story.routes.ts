import { Router } from "express";

import { storyController } from "../controllers/story.controller";
import { likeController } from "../controllers/like.controller";
import { commentController } from "../controllers/comment.controller";

import { authenticateToken, optionalAuthenticateToken } from "../middlewares/auth.middleware";
import { uploadOptionalImage } from "../middlewares/upload.middleware";
import validate from "../middlewares/validate.middleware";
import { usernameParamSchema } from "../middlewares/user.validation";
import {
  createStorySchema,
  updateStorySchema,
  storySlugParamSchema,
  storyIdentifierParamSchema,
  publicStoriesQuerySchema,
  userStoriesQuerySchema,
  myStoriesQuerySchema,
  allStoriesQuerySchema,
  storyInteractionQuerySchema,
  storyUuidBodySchema,
  storyUuidQuerySchema,
  storyUuidWithPaginationQuerySchema,
} from "../middlewares/story.validation";
import { createCommentSchema } from "../middlewares/comment.validation";
import { uuidParamSchema } from "../middlewares/common.validation";

const router = Router();

// ==========================================
// PUBLIC ROUTES (Optional or no authentication required)
// ==========================================

// GET /api/stories/public - Get all public published stories
router.get(
  "/public",
  validate({ query: publicStoriesQuerySchema }),
  (req, res) => storyController.getPublicStories(req, res)
);

// GET /api/stories/user/:username - Get stories by a specific user (filters followers-only if not followed)
router.get(
  "/user/:username",
  optionalAuthenticateToken,
  validate({
    params: usernameParamSchema,
    query: userStoriesQuerySchema,
  }),
  (req, res) => storyController.getStoriesByUser(req, res)
);

// GET /api/stories/slug/:slug - Get a single story by slug (checks followers-only permissions)
router.get(
  "/slug/:slug",
  optionalAuthenticateToken,
  validate({ params: storySlugParamSchema }),
  (req, res) => storyController.getStoryBySlug(req, res)
);

// ==========================================
// PROTECTED STORY MANAGEMENT ROUTES
// ==========================================

// POST /api/stories/create - Create a new story (supports JSON or multipart with image)
router.post(
  "/create",
  authenticateToken,
  uploadOptionalImage,
  validate({ body: createStorySchema }),
  (req, res) => storyController.createStory(req, res)
);

// GET /api/stories/my - Get current user's stories
router.get(
  "/my",
  authenticateToken,
  validate({ query: myStoriesQuerySchema }),
  (req, res) => storyController.getMyStories(req, res)
);

// GET /api/stories/stats/my - Get current user's story statistics
router.get(
  "/stats/my",
  authenticateToken,
  (req, res) => storyController.getMyStoryStats(req, res)
);

// GET /api/stories - Get all stories with filters
router.get(
  "/",
  authenticateToken,
  validate({ query: allStoriesQuerySchema }),
  (req, res) => storyController.getAllStories(req, res)
);

// ==========================================
// SOCIAL INTERACTIONS: LIKES & COMMENTS
// ==========================================

// POST /api/stories/like - Like a story
router.post(
  "/like",
  authenticateToken,
  validate({ body: storyUuidBodySchema }),
  (req, res) => likeController.likeStory(req, res)
);

// DELETE /api/stories/like - Unlike a story
router.delete(
  "/like",
  authenticateToken,
  validate({ body: storyUuidBodySchema }),
  (req, res) => likeController.unlikeStory(req, res)
);

// POST /api/stories/like/toggle - Toggle like on a story
router.post(
  "/like/toggle",
  authenticateToken,
  validate({ body: storyUuidBodySchema }),
  (req, res) => likeController.toggleLike(req, res)
);

// GET /api/stories/likes - Get users who liked a story
router.get(
  "/likes",
  optionalAuthenticateToken,
  validate({
    query: storyUuidWithPaginationQuerySchema,
  }),
  (req, res) => likeController.getStoryLikes(req, res)
);

// GET /api/stories/like/status - Check if authenticated user liked story
router.get(
  "/like/status",
  authenticateToken,
  validate({ query: storyUuidQuerySchema }),
  (req, res) => likeController.getStoryLikeStatus(req, res)
);

// POST /api/stories/comments - Add a comment to a story
router.post(
  "/comments",
  authenticateToken,
  validate({
    body: createCommentSchema,
  }),
  (req, res) => commentController.addComment(req, res)
);

// GET /api/stories/comments - Get all comments on a story
router.get(
  "/comments",
  optionalAuthenticateToken,
  validate({
    query: storyUuidWithPaginationQuerySchema,
  }),
  (req, res) => commentController.getStoryComments(req, res)
);

// ==========================================
// STORY MUTATION ROUTES BY SLUG
// ==========================================

// PUT /api/stories/:slug - Update a story (supports JSON or multipart with image)
router.put(
  "/:slug",
  authenticateToken,
  uploadOptionalImage,
  validate({
    params: storySlugParamSchema,
    body: updateStorySchema,
  }),
  (req, res) => storyController.updateStory(req, res)
);

// DELETE /api/stories/:slug - Delete a story
router.delete(
  "/:slug",
  authenticateToken,
  validate({ params: storySlugParamSchema }),
  (req, res) => storyController.deleteStory(req, res)
);

export default router;
