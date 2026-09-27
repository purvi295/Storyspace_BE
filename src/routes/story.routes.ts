import { Router } from "express";

import { storyController } from "../controllers/story.controller";
import { likeController } from "../controllers/like.controller";
import { commentController } from "../controllers/comment.controller";

import { authenticateToken } from "../middlewares/auth.middleware";
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
} from "../middlewares/story.validation";
import { createCommentSchema } from "../middlewares/comment.validation";

const router = Router();

// ==========================================
// PUBLIC ROUTES (No authentication required)
// ==========================================

// GET /api/stories/public - Get all public published stories
router.get(
  "/public",
  validate({ query: publicStoriesQuerySchema }),
  (req, res) => storyController.getPublicStories(req, res)
);

// GET /api/stories/user/:username - Get stories by a specific user
router.get(
  "/user/:username",
  validate({
    params: usernameParamSchema,
    query: userStoriesQuerySchema,
  }),
  (req, res) => storyController.getStoriesByUser(req, res)
);

// GET /api/stories/slug/:slug - Get a single story by slug
router.get(
  "/slug/:slug",
  validate({ params: storySlugParamSchema }),
  (req, res) => storyController.getStoryBySlug(req, res)
);

// ==========================================
// PROTECTED STORY MANAGEMENT ROUTES
// ==========================================

// POST /api/stories/create - Create a new story
router.post(
  "/create",
  authenticateToken,
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

// POST /api/stories/:identifier/like - Like a story
router.post(
  "/:identifier/like",
  authenticateToken,
  validate({ params: storyIdentifierParamSchema }),
  (req, res) => likeController.likeStory(req, res)
);

// DELETE /api/stories/:identifier/like - Unlike a story
router.delete(
  "/:identifier/like",
  authenticateToken,
  validate({ params: storyIdentifierParamSchema }),
  (req, res) => likeController.unlikeStory(req, res)
);

// POST /api/stories/:identifier/like/toggle - Toggle like on a story
router.post(
  "/:identifier/like/toggle",
  authenticateToken,
  validate({ params: storyIdentifierParamSchema }),
  (req, res) => likeController.toggleLike(req, res)
);

// GET /api/stories/:identifier/likes - Get users who liked a story
router.get(
  "/:identifier/likes",
  validate({
    params: storyIdentifierParamSchema,
    query: storyInteractionQuerySchema,
  }),
  (req, res) => likeController.getStoryLikes(req, res)
);

// GET /api/stories/:identifier/like/status - Check if authenticated user liked story
router.get(
  "/:identifier/like/status",
  authenticateToken,
  validate({ params: storyIdentifierParamSchema }),
  (req, res) => likeController.getStoryLikeStatus(req, res)
);

// POST /api/stories/:identifier/comments - Add a comment to a story
router.post(
  "/:identifier/comments",
  authenticateToken,
  validate({
    params: storyIdentifierParamSchema,
    body: createCommentSchema,
  }),
  (req, res) => commentController.addComment(req, res)
);

// GET /api/stories/:identifier/comments - Get all comments on a story
router.get(
  "/:identifier/comments",
  validate({
    params: storyIdentifierParamSchema,
    query: storyInteractionQuerySchema,
  }),
  (req, res) => commentController.getStoryComments(req, res)
);

// ==========================================
// STORY MUTATION ROUTES BY SLUG
// ==========================================

// PUT /api/stories/:slug - Update a story
router.put(
  "/:slug",
  authenticateToken,
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
