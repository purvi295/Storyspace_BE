// src/routes/internal.routes.ts
// These routes are called by the Python AI agent — NOT by the browser.
// Protected by a shared secret (x-internal-key), never exposed publicly.

import { Router, Request, Response, NextFunction } from "express";
import { storyRepository } from "../repositories/story.repository";
import { sendErrorResponse, sendApiResponse } from "../utils/api.response";

const router = Router();

// Internal key guard middleware
const internalKeyGuard = (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers["x-internal-key"];
  if (key !== process.env.AI_INTERNAL_KEY) {
    return sendErrorResponse(res, 401, "Unauthorized");
  }
  next();
};

// GET /internal/stories/search?q=sea&viewerId=<uuid>&page=1&limit=10
router.get(
  "/stories/search",
  internalKeyGuard,
  async (req: Request, res: Response) => {
    const {
      q,
      viewerId,
      page = "1",
      limit = "10",
    } = req.query as Record<string, string>;

    if (!q) return sendErrorResponse(res, 400, 'Query param "q" is required');

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(20, parseInt(limit) || 10);

    try {
      const { stories: filtered, total } = await storyRepository.findAllWithFilters({
        page: pageNum,
        limit: limitNum,
        currentUserUuid: viewerId,
        searchQuery: q,
      });

      // Return only safe fields — never expose internal IDs
      const safeStories = filtered.map((s) => ({
        uuid: s.story_uuid,
        title: s.title,
        slug: s.slug,
        summary: s.summary || "",
        content: s.content.slice(0, 500), // cap content for AI
        status: s.status,
        visibility: s.visibility,
        publishedAt: s.published_at,
      }));

      return sendApiResponse(
        res,
        200,
        {
          stories: safeStories,
          total,
        },
        "Stories fetched",
      );
    } catch (err) {
      console.error("[Internal] Story search failed:", err);
      return sendErrorResponse(res, 500, "Internal error");
    }
  },
);

// GET /internal/stories/:uuid — get a single story by UUID (for summarize)
router.get(
  "/stories/:uuid",
  internalKeyGuard,
  async (req: Request, res: Response) => {
    const uuid = req.params.uuid as string;
    const { viewerId } = req.query as { viewerId?: string };

    try {
      const story = await storyRepository.findByUuid(uuid);
      if (!story) return sendErrorResponse(res, 404, "Story not found");

      // Enforce visibility
      if (story.visibility === "followers_only") {
        // If no viewerId, deny
        if (!viewerId)
          return sendErrorResponse(
            res,
            403,
            "This story is for followers only",
          );
        // You can add follower check here if needed
      }

      return sendApiResponse(
        res,
        200,
        {
          uuid: story.story_uuid,
          title: story.title,
          slug: story.slug,
          content: story.content,
          summary: story.summary || "",
          status: story.status,
          visibility: story.visibility,
        },
        "Story fetched",
      );
    } catch (err) {
      console.error("[Internal] Story fetch failed:", err);
      return sendErrorResponse(res, 500, "Internal error");
    }
  },
);

export default router;
