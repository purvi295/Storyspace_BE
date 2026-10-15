import { Request, Response } from "express";
import { adminService } from "../services/admin.service";
import { commentService } from "../services/comment.service";
import {
  sendApiResponse,
  sendErrorResponse,
  sendPaginatedResponse,
} from "../utils/api.response";
import { AppError } from "../utils/api.error";

export class AdminController {
  // GET /api/admin/stats
  // async getStats(_req: Request, res: Response) {
  //   try {
  //     const stats = await adminService.getPlatformStats();
  //     return sendApiResponse(res, 200, { stats }, "Platform stats retrieved successfully");
  //   } catch (error: unknown) {
  //     const err = error as AppError;
  //     return sendErrorResponse(res, err.statusCode || 500, (error as Error).message);
  //   }
  // }

  // GET /api/admin/users
  async listUsers(req: Request, res: Response) {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const search = req.query.search as string | undefined;

      const result = await adminService.listUsers({ page, limit, search });
      return sendPaginatedResponse(
        res,
        result,
        "Users retrieved successfully",
      );
    } catch (error: unknown) {
      const err = error as AppError;
      return sendErrorResponse(
        res,
        err.statusCode || 500,
        (error as Error).message,
      );
    }
  }

  // DELETE /api/admin/stories
  async deleteStory(req: Request, res: Response) {
    try {
      const story_uuid = req.body.story_uuid;
      if (!story_uuid || typeof story_uuid !== "string") {
        return sendErrorResponse(res, 400, "Story UUID is required");
      }
      const result = await adminService.deleteStory(story_uuid);
      return sendApiResponse(res, 200, result, "Story deleted successfully");
    } catch (error: unknown) {
      const err = error as AppError;
      return sendErrorResponse(
        res,
        err.statusCode || 400,
        (error as Error).message,
      );
    }
  }

  // DELETE /api/admin/comments/:comment_uuid
  async deleteComment(req: Request, res: Response) {
    try {
      const comment_uuid = Array.isArray(req.params.comment_uuid) ? req.params.comment_uuid[0] : req.params.comment_uuid;
      const user_uuid = req.user?.user_uuid;
      const role = req.user?.role || "admin";

      if (!user_uuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const result = await commentService.deleteComment(
        comment_uuid,
        user_uuid,
        role,
      );
      return sendApiResponse(res, 200, result, "Comment deleted successfully");
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

export const adminController = new AdminController();
