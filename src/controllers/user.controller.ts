import { Request, Response } from "express";
import { UpdateUserProfileDto } from "../dtos/user.dto";
import { userService } from "../services/user.service";
import { followService } from "../services/follow.service";
import {
  sendApiResponse,
  sendErrorResponse,
  sendPaginatedResponse,
} from "../utils/api.response";

export class UserController {
  // Helper to extract a single string target from params
  private getTargetParam(req: Request): string | null {
    const raw =
      req.params.target ||
      req.params.username ||
      req.params.user_uuid ||
      req.params.id;
    if (!raw) return null;
    return Array.isArray(raw) ? raw[0] : String(raw);
  }

  // Get public profile by username with follower/following counts
  async getPublicProfile(req: Request, res: Response) {
    try {
      const username = this.getTargetParam(req);

      if (!username) {
        return sendErrorResponse(res, 400, "Username is required");
      }

      const user = await userService.getPublicProfile(username);

      return sendApiResponse(res, 200, { user }, "User profile fetched successfully");
    } catch (error: any) {
      const status = error.statusCode || (error.message === "User not found" ? 404 : 500);
      return sendErrorResponse(res, status, error.message);
    }
  }

  // Update own profile
  async updateProfile(
    req: Request<{}, unknown, UpdateUserProfileDto>,
    res: Response
  ) {
    try {
      if (!req.user) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const updateData = { ...req.body };

      if (req.file) {
        const uploadResult = await storageService.uploadImage(req.file, "avatars");
        updateData.avatar_url = uploadResult.url;
      }

      const user = await userService.updateProfile(req.user.user_uuid, updateData);

      return sendApiResponse(res, 200, { user }, "Profile updated successfully");
    } catch (error: any) {
      const status = error.statusCode || (error.message === "User not found" ? 404 : 500);
      return sendErrorResponse(res, status, error.message);
    }
  }

  // Get all user list excluding the admins
  async getAllUsersList(req: Request, res: Response) {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const { users, pagination } = await userService.getAllUsers(page, limit);

      return sendPaginatedResponse(
        res,
        users,
        pagination,
        "Users list fetched successfully"
      );
    } catch (err: any) {
      const status = err.statusCode || 500;
      return sendErrorResponse(res, status, err.message);
    }
  }

  // POST /api/users/:target/follow - Follow a user
  async followUser(req: Request, res: Response) {
    try {
      const followerUuid = req.user?.user_uuid;
      if (!followerUuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const target = this.getTargetParam(req);
      if (!target) {
        return sendErrorResponse(res, 400, "Target user identifier is required");
      }

      const result = await followService.followUser(followerUuid, target);
      const statusCode = result.alreadyFollowing ? 200 : 201;

      return sendApiResponse(res, statusCode, result, result.message);
    } catch (error: any) {
      const status = error.statusCode || 400;
      return sendErrorResponse(res, status, error.message);
    }
  }

  // DELETE /api/users/:target/follow - Unfollow a user
  async unfollowUser(req: Request, res: Response) {
    try {
      const followerUuid = req.user?.user_uuid;
      if (!followerUuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const target = this.getTargetParam(req);
      if (!target) {
        return sendErrorResponse(res, 400, "Target user identifier is required");
      }

      const result = await followService.unfollowUser(followerUuid, target);
      return sendApiResponse(res, 200, result, result.message);
    } catch (error: any) {
      const status = error.statusCode || 400;
      return sendErrorResponse(res, status, error.message);
    }
  }

  // GET /api/users/:target/followers - Get user's followers
  async getFollowers(req: Request, res: Response) {
    try {
      const target = this.getTargetParam(req);
      if (!target) {
        return sendErrorResponse(res, 400, "Target user identifier is required");
      }

      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const result = await followService.getFollowers(target, page, limit);

      return sendPaginatedResponse(
        res,
        result.followers,
        result.pagination,
        "Followers retrieved successfully"
      );
    } catch (error: any) {
      const status = error.statusCode || 500;
      return sendErrorResponse(res, status, error.message);
    }
  }

  // GET /api/users/:target/following - Get users followed by user
  async getFollowing(req: Request, res: Response) {
    try {
      const target = this.getTargetParam(req);
      if (!target) {
        return sendErrorResponse(res, 400, "Target user identifier is required");
      }

      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const result = await followService.getFollowing(target, page, limit);

      return sendPaginatedResponse(
        res,
        result.following,
        result.pagination,
        "Following list retrieved successfully"
      );
    } catch (error: any) {
      const status = error.statusCode || 500;
      return sendErrorResponse(res, status, error.message);
    }
  }

  // GET /api/users/:target/is-following - Check if current user is following target
  async isFollowing(req: Request, res: Response) {
    try {
      const followerUuid = req.user?.user_uuid;
      if (!followerUuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const target = this.getTargetParam(req);
      if (!target) {
        return sendErrorResponse(res, 400, "Target user identifier is required");
      }

      const result = await followService.isFollowing(followerUuid, target);
      return sendApiResponse(res, 200, result, "Follow status retrieved successfully");
    } catch (error: any) {
      const status = error.statusCode || 400;
      return sendErrorResponse(res, status, error.message);
    }
  }
}

export const userController = new UserController();
