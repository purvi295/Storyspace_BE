import { Router } from "express";

import { storyController } from "../controllers/story.controller";

import { authenticateToken } from "../middlewares/auth.middleware";
import validate from "../middlewares/validate.middleware";
import {
  createStorySchema,
  updateStorySchema,
} from "../middlewares/story.validation";

const router = Router();

// ==========================================
// PUBLIC ROUTES (No authentication required)
// ==========================================

// GET /api/stories/public - Get all public published stories
router.get("/public", (req, res) => storyController.getPublicStories(req, res));

// GET /api/stories/user/:username - Get stories by a specific user
router.get("/user/:username", (req, res) => storyController.getStoriesByUser(req, res));

// GET /api/stories/slug/:slug - Get a single story by slug
router.get("/slug/:slug", (req, res) => storyController.getStoryBySlug(req, res));

// ==========================================
// PROTECTED ROUTES (Authentication required)
// ==========================================

// POST /api/stories/create - Create a new story
router.post(
  "/create",
  authenticateToken,
  validate(createStorySchema),
  (req, res) => storyController.createStory(req, res),
);

// GET /api/stories/my - Get current user's stories
router.get("/my", authenticateToken, (req, res) => storyController.getMyStories(req, res));

// GET /api/stories - Get all stories with filters
router.get("/", authenticateToken, (req, res) => storyController.getAllStories(req, res));

// PUT /api/stories/:slug - Update a story
router.put(
  "/:slug",
  authenticateToken,
  validate(updateStorySchema),
  (req, res) => storyController.updateStory(req, res),
);

// DELETE /api/stories/:slug - Delete a story
router.delete(
  "/:slug",
  authenticateToken,
  (req, res) => storyController.deleteStory(req, res),
);

// GET /api/stories/stats/my - Get current user's story statistics
router.get(
  "/stats/my",
  authenticateToken,
  (req, res) => storyController.getMyStoryStats(req, res),
);

export default router;
