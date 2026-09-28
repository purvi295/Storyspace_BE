import { Request, Response } from "express";
import { likeService } from "../services/like.service";
import {
  sendApiResponse,
  sendErrorResponse,
  sendPaginatedResponse,
} from "../utils/api.response";

export class LikeController {
  // POST /api/stories/:identifier/like
  async likeStory(
    req: Request<{ identifier?: string; story_uuid?: string }>,
    res: Response
  ) {
    try {
      const user_uuid = req.user?.user_uuid;
      if (!user_uuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const identifier = req.params.story_uuid || req.params.identifier;
      if (!identifier) {
        return sendErrorResponse(res, 400, "Story identifier is required");
      }

      const result = await likeService.likeStory(identifier, user_uuid);
      const statusCode = result.alreadyLiked ? 200 : 201;

      return sendApiResponse(res, statusCode, result, result.message);
    } catch (error: any) {
      const status = error.statusCode || 400;
      return sendErrorResponse(res, status, error.message);
    }
  }

  // DELETE /api/stories/:identifier/like
  async unlikeStory(
    req: Request<{ identifier?: string; story_uuid?: string }>,
    res: Response
  ) {
    try {
      const user_uuid = req.user?.user_uuid;
      if (!user_uuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const identifier = req.params.story_uuid || req.params.identifier;
      if (!identifier) {
        return sendErrorResponse(res, 400, "Story identifier is required");
      }

      const result = await likeService.unlikeStory(identifier, user_uuid);
      return sendApiResponse(res, 200, result, result.message);
    } catch (error: any) {
      const status = error.statusCode || 400;
      return sendErrorResponse(res, status, error.message);
    }
  }

  // POST /api/stories/:identifier/like/toggle
  async toggleLike(
    req: Request<{ identifier?: string; story_uuid?: string }>,
    res: Response
  ) {
    try {
      const user_uuid = req.user?.user_uuid;
      if (!user_uuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const identifier = req.params.story_uuid || req.params.identifier;
      if (!identifier) {
        return sendErrorResponse(res, 400, "Story identifier is required");
      }

      const result = await likeService.toggleLike(identifier, user_uuid);
      return sendApiResponse(res, 200, result, result.message);
    } catch (error: any) {
      const status = error.statusCode || 400;
      return sendErrorResponse(res, status, error.message);
    }
  }

  // GET /api/stories/:identifier/likes
  async getStoryLikes(
    req: Request<{ identifier?: string; story_uuid?: string }>,
    res: Response
  ) {
    try {
      const identifier = req.params.story_uuid || req.params.identifier;
      if (!identifier) {
        return sendErrorResponse(res, 400, "Story identifier is required");
      }

      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const result = await likeService.getStoryLikes(
        identifier,
        page,
        limit,
        req.user?.user_uuid,
        req.user?.role
      );

      return sendPaginatedResponse(
        res,
        result.likes,
        result.pagination,
        "Story likes retrieved successfully"
      );
    } catch (error: any) {
      const status = error.statusCode || 500;
      return sendErrorResponse(res, status, error.message);
    }
  }

  // GET /api/stories/:identifier/like/status
  async getStoryLikeStatus(
    req: Request<{ identifier?: string; story_uuid?: string }>,
    res: Response
  ) {
    try {
      const user_uuid = req.user?.user_uuid;
      if (!user_uuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const identifier = req.params.story_uuid || req.params.identifier;
      if (!identifier) {
        return sendErrorResponse(res, 400, "Story identifier is required");
      }

      const result = await likeService.getStoryLikeStatus(
        identifier,
        user_uuid
      );

      return sendApiResponse(res, 200, result, "Like status retrieved successfully");
    } catch (error: any) {
      const status = error.statusCode || 400;
      return sendErrorResponse(res, status, error.message);
    }
  }
}

export const likeController = new LikeController();
