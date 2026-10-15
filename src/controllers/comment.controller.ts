
import { Request, Response } from "express";
import { commentService } from "../services/comment.service";
import {
  sendApiResponse,
  sendErrorResponse,
  sendPaginatedResponse,
} from "../utils/api.response";
import { CreateCommentDto, UpdateCommentDto } from "../dtos/comment.dto";
import { AppError } from "../utils/api.error";

export class CommentController {
  // POST /api/comments
  async addComment(req: Request, res: Response) {
    try {
      const user_uuid = req.user?.user_uuid;
      if (!user_uuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const story_uuid = req.body.story_uuid;
      const content = req.body.content;

      if (!story_uuid || typeof story_uuid !== 'string') {
        return sendErrorResponse(res, 400, "Story UUID is required");
      }

      if (!content || typeof content !== 'string') {
        return sendErrorResponse(res, 400, "Comment content is required");
      }

      const comment = await commentService.addComment(story_uuid, user_uuid, { content }, req.user?.role);
      return sendApiResponse(res, 201, comment, "Comment added successfully");
    } catch (error: unknown) {
      const err = error as AppError;
      return sendErrorResponse(res, err.statusCode || 400, (error as Error).message);
    }
  }

  // GET /api/comments
  async getStoryComments(req: Request, res: Response) {
    try {
      const story_uuid = req.query.story_uuid as string;
      if (!story_uuid || typeof story_uuid !== 'string') {
        return sendErrorResponse(res, 400, "Story UUID is required");
      }

      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const result = await commentService.getStoryComments(story_uuid, page, limit, req.user?.user_uuid, req.user?.role);

      return sendPaginatedResponse(
        res,
        result,
        "Story comments retrieved successfully"
      );
    } catch (error: unknown) {
      const err = error as AppError;
      return sendErrorResponse(res, err.statusCode || 400, (error as Error).message);
    }
  }

  // GET /api/comments/:comment_uuid
  async getCommentById(req: Request, res: Response) {
    try {
      const comment_uuid = Array.isArray(req.params.comment_uuid) ? req.params.comment_uuid[0] : req.params.comment_uuid;
      if (!comment_uuid) {
        return sendErrorResponse(res, 400, "Comment UUID is required");
      }

      const comment = await commentService.getCommentById(comment_uuid);
      return sendApiResponse(res, 200, comment, "Comment retrieved successfully");
    } catch (error: unknown) {
      const err = error as AppError;
      return sendErrorResponse(
        res,
        err.statusCode || 404,
        (error as Error).message,
      );
    }
  }

  // PUT /api/comments/:comment_uuid
  async updateComment(req: Request, res: Response) {
    try {
      const user_uuid = req.user?.user_uuid;
      if (!user_uuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const comment_uuid = Array.isArray(req.params.comment_uuid) ? req.params.comment_uuid[0] : req.params.comment_uuid;
      if (!comment_uuid) {
        return sendErrorResponse(res, 400, "Comment UUID is required");
      }

      const comment = await commentService.updateComment(
        comment_uuid,
        user_uuid,
        req.body
      );

      return sendApiResponse(res, 200, comment, "Comment updated successfully");
    } catch (error: unknown) {
      const err = error as AppError;
      return sendErrorResponse(
        res,
        err.statusCode || 400,
        (error as Error).message,
      );
    }
  }

  // DELETE /api/comments/:comment_uuid
  async deleteComment(req: Request, res: Response) {
    try {
      const user_uuid = req.user?.user_uuid;
      const userRole = req.user?.role;
      if (!user_uuid || !userRole) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const comment_uuid = Array.isArray(req.params.comment_uuid) ? req.params.comment_uuid[0] : req.params.comment_uuid;
      if (!comment_uuid) {
        return sendErrorResponse(res, 400, "Comment UUID is required");
      }

      const result = await commentService.deleteComment(comment_uuid, user_uuid, userRole);
      return sendApiResponse(res, 200, result, result.message);
    } catch (error: unknown) {
      const err = error as AppError;
      return sendErrorResponse(
        res,
        err.statusCode || 400,
        (error as Error).message,
      );
    }
  }
}

export const commentController = new CommentController();
