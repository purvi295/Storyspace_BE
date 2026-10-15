import { Request, Response } from "express";
import { likeService } from "../services/like.service";
import {
  sendApiResponse,
  sendErrorResponse,
  sendPaginatedResponse,
} from "../utils/api.response";
import { AppError } from "../utils/api.error";

export class LikeController {
  // POST /api/stories/:story_uuid/like
  async likeStory(
    req: Request<{ story_uuid?: string }>,
    res: Response
  ) {
    try {
      const user_uuid = req.user?.user_uuid;
      if (!user_uuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const story_uuid = req.params.story_uuid;
      if (!story_uuid) {
        return sendErrorResponse(res, 400, "Story UUID is required");
      }

      const result = await likeService.likeStory(story_uuid, user_uuid);
      const statusCode = result.alreadyLiked ? 200 : 201;

      return sendApiResponse(res, statusCode, result, result.message);
    } catch (error: unknown) {
      const err = error as AppError;
      return sendErrorResponse(res, err.statusCode || 400, (error as Error).message);
    }
  }

  // DELETE /api/stories/like
  async unlikeStory(req: Request, res: Response) {
    try {
      const user_uuid = req.user?.user_uuid;
      if (!user_uuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const story_uuid = req.body.story_uuid;
      if (!story_uuid || typeof story_uuid !== 'string') {
        return sendErrorResponse(res, 400, "Story UUID is required");
      }

      const result = await likeService.unlikeStory(story_uuid, user_uuid);
      return sendApiResponse(res, 200, result, result.message);
    } catch (error: unknown) {
      const err = error as AppError;
      return sendErrorResponse(res, err.statusCode || 400, (error as Error).message);
    }
  }

  // POST /api/stories/like/toggle
  async toggleLike(req: Request, res: Response) {
    try {
      const user_uuid = req.user?.user_uuid;
      if (!user_uuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const story_uuid = req.body.story_uuid;
      if (!story_uuid || typeof story_uuid !== 'string') {
        return sendErrorResponse(res, 400, "Story UUID is required");
      }

      const result = await likeService.toggleLike(user_uuid, story_uuid);
      return sendApiResponse(res, 200, result, result.message);
    } catch (error: unknown) {
      const err = error as AppError;
      return sendErrorResponse(res, err.statusCode || 400, (error as Error).message);
    }
  }

  // GET /api/stories/likes
  async getStoryLikes(req: Request, res: Response) {
    try {
      const story_uuid = req.query.story_uuid as string;
      if (!story_uuid || typeof story_uuid !== 'string') {
        return sendErrorResponse(res, 400, "Story UUID is required");
      }

      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const result = await likeService.getStoryLikes(story_uuid, page, limit, req.user?.user_uuid, req.user?.role);
      return sendPaginatedResponse(
        res,
        result,
        "Story likes retrieved successfully"
      );
    } catch (error: unknown) {
      const err = error as AppError;
      return sendErrorResponse(res, err.statusCode || 400, (error as Error).message);
    }
  }

  // GET /api/stories/like/status
  async getStoryLikeStatus(req: Request, res: Response) {
    try {
      const user_uuid = req.user?.user_uuid;
      if (!user_uuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const story_uuid = req.query.story_uuid as string;
      if (!story_uuid || typeof story_uuid !== 'string') {
        return sendErrorResponse(res, 400, "Story UUID is required");
      }

      const result = await likeService.getStoryLikeStatus(user_uuid, story_uuid);
      return sendApiResponse(res, 200, result, "Story like status retrieved successfully");
    } catch (error: unknown) {
      const err = error as AppError;
      return sendErrorResponse(res, err.statusCode || 400, (error as Error).message);
    }
  }
}

export const likeController = new LikeController();
