import { Request, Response } from "express";
import { adminService } from "../services/admin.service";
import { commentService } from "../services/comment.service";
import {
  sendApiResponse,
  sendErrorResponse,
  sendPaginatedResponse,
} from "../utils/api.response";

export class AdminController {
  // GET /api/admin/stats
  async getStats(_req: Request, res: Response) {
    try {
      const stats = await adminService.getPlatformStats();
      return sendApiResponse(res, 200, { stats }, "Platform stats retrieved successfully");
    } catch (error: any) {
      return sendErrorResponse(res, error.statusCode || 500, error.message);
    }
  }

  // GET /api/admin/users
  async listUsers(req: Request, res: Response) {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const search = req.query.search as string | undefined;

      const result = await adminService.listUsers({ page, limit, search });
      return sendPaginatedResponse(
        res,
        result.users,
        result.pagination,
        "Users retrieved successfully"
      );
    } catch (error: any) {
      return sendErrorResponse(res, error.statusCode || 500, error.message);
    }
  }

  // DELETE /api/admin/stories/:identifier
  async deleteStory(req: Request, res: Response) {
    try {
      const identifier = req.params.identifier as string;
      const result = await adminService.deleteStory(identifier);
      return sendApiResponse(res, 200, result, "Story deleted successfully");
    } catch (error: any) {
      return sendErrorResponse(res, error.statusCode || 400, error.message);
    }
  }

  // DELETE /api/admin/comments/:id
  async deleteComment(req: Request, res: Response) {
    try {
      const commentId = Number(req.params.id);
      const user_uuid = req.user?.user_uuid;
      const role = req.user?.role || "admin";

      if (!user_uuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const result = await commentService.deleteComment(commentId, user_uuid, role);
      return sendApiResponse(res, 200, result, "Comment deleted successfully");
    } catch (error: any) {
      return sendErrorResponse(res, error.statusCode || 400, error.message);
    }
  }
}

export const adminController = new AdminController();
