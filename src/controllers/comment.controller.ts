
import { Request, Response } from "express";
import { commentService } from "../services/comment.service";
import {
  sendApiResponse,
  sendErrorResponse,
  sendPaginatedResponse,
} from "../utils/api.response";
import { CreateCommentDto, UpdateCommentDto } from "../dtos/comment.dto";

export class CommentController {
  // POST /api/stories/:identifier/comments
  async addComment(
    req: Request<{ identifier?: string; story_uuid?: string }, unknown, CreateCommentDto>,
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

      const comment = await commentService.addComment(
        identifier,
        user_uuid,
        req.body
      );

      return sendApiResponse(res, 201, comment, "Comment added successfully");
    } catch (error: any) {
      const status = error.statusCode || 400;
      return sendErrorResponse(res, status, error.message);
    }
  }

  // GET /api/stories/:identifier/comments
  async getStoryComments(
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

      const result = await commentService.getStoryComments(
        identifier,
        page,
        limit
      );

      return sendPaginatedResponse(
        res,
        result.comments,
        result.pagination,
        "Comments retrieved successfully"
      );
    } catch (error: any) {
      const status = error.statusCode || 500;
      return sendErrorResponse(res, status, error.message);
    }
  }

  // GET /api/comments/:id
  async getCommentById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return sendErrorResponse(res, 400, "Invalid comment ID");
      }

      const comment = await commentService.getCommentById(id);
      return sendApiResponse(res, 200, comment, "Comment retrieved successfully");
    } catch (error: any) {
      const status = error.statusCode || 404;
      return sendErrorResponse(res, status, error.message);
    }
  }

  // PUT /api/comments/:id
  async updateComment(req: Request, res: Response) {
    try {
      const user_uuid = req.user?.user_uuid;
      if (!user_uuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const id = Number(req.params.id);
      if (isNaN(id)) {
        return sendErrorResponse(res, 400, "Invalid comment ID");
      }

      const comment = await commentService.updateComment(
        id,
        user_uuid,
        req.body
      );

      return sendApiResponse(res, 200, comment, "Comment updated successfully");
    } catch (error: any) {
      const status = error.statusCode || 400;
      return sendErrorResponse(res, status, error.message);
    }
  }

  // DELETE /api/comments/:id
  async deleteComment(req: Request, res: Response) {
    try {
      const user_uuid = req.user?.user_uuid;
      const userRole = req.user?.role;
      if (!user_uuid || !userRole) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const id = Number(req.params.id);
      if (isNaN(id)) {
        return sendErrorResponse(res, 400, "Invalid comment ID");
      }

      const result = await commentService.deleteComment(id, user_uuid, userRole);
      return sendApiResponse(res, 200, result, result.message);
    } catch (error: any) {
      const status = error.statusCode || 400;
      return sendErrorResponse(res, status, error.message);
    }
  }
}

export const commentController = new CommentController();
