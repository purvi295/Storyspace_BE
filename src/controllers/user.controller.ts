import { Request, Response } from "express";
import { UpdateUserProfileDto } from "../dtos/user.dto";
import { userService } from "../services/user.service";
import { followService } from "../services/follow.service";
import { storageService } from "../services/storage.service";
import {
  sendApiResponse,
  sendErrorResponse,
  sendPaginatedResponse,
} from "../utils/api.response";
import { AppError } from "../utils/api.error";

export class UserController {
  // Get public profile by username with follower/following counts
  async getPublicProfile(req: Request, res: Response) {
    try {
      const userUuid = req.params.user_uuid;

      const user = await userService.getPublicProfile(userUuid);

      return sendApiResponse(
        res,
        200,
        { user },
        "User profile fetched successfully",
      );
    } catch (error: any) {
      const status =
        error.statusCode || (error.message === "User not found" ? 404 : 500);
      return sendErrorResponse(res, status, error.message);
    }
  }

  // Update own profile
  async updateProfile(
    req: Request<{}, unknown, UpdateUserProfileDto>,
    res: Response,
  ) {
    try {
      if (!req.user) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const updateData = { ...req.body };

      if (req.file) {
        const uploadResult = await storageService.uploadImage(
          req.file,
          "avatars",
        );
        updateData.avatar_url = uploadResult.url;
      }

      const user = await userService.updateProfile(
        req.user.user_uuid,
        updateData,
      );

      return sendApiResponse(
        res,
        200,
        { user },
        "Profile updated successfully",
      );
    } catch (error: any) {
      const status =
        error.statusCode || (error.message === "User not found" ? 404 : 500);
      return sendErrorResponse(res, status, error.message);
    }
  }

  // Get all user list excluding the admins
  async getAllUsersList(req: Request, res: Response) {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const search = req.query.search as string | undefined;
      const { users, pagination } = await userService.getAllUsers(page, limit, search);

      return sendPaginatedResponse(
        res,
        users,
        pagination,
        "Users list fetched successfully",
      );
    } catch (err: any) {
      const status = err.statusCode || 500;
      return sendErrorResponse(res, status, err.message);
    }
  }

  // POST /api/users/follow - Follow a user
  async followUser(req: Request, res: Response) {
    try {
      const followerUuid = req.user?.user_uuid;
      if (!followerUuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const followingUuid = req.body.user_uuid;
      if (!followingUuid || typeof followingUuid !== "string") {
        return sendErrorResponse(res, 400, "User UUID is required");
      }

      const result = await followService.followUser(
        followerUuid,
        followingUuid,
      );
      const statusCode = result.alreadyFollowing ? 200 : 201;

      return sendApiResponse(res, statusCode, result, result.message);
    } catch (error: unknown) {
      const err = error as AppError;
      return sendErrorResponse(
        res,
        err.statusCode || 400,
        (error as Error).message,
      );
    }
  }

  // DELETE /api/users/follow - Unfollow a user
  async unfollowUser(req: Request, res: Response) {
    try {
      const followerUuid = req.user?.user_uuid;
      if (!followerUuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const followingUuid = req.body.user_uuid;
      if (!followingUuid || typeof followingUuid !== "string") {
        return sendErrorResponse(res, 400, "User UUID is required");
      }

      const result = await followService.unfollowUser(
        followerUuid,
        followingUuid,
      );
      return sendApiResponse(res, 200, result, result.message);
    } catch (error: unknown) {
      const err = error as AppError;
      const status = err.statusCode || 400;
      return sendErrorResponse(res, status, (error as Error).message);
    }
  }

  // GET /api/users/followers - Get user's followers
  async getFollowers(req: Request, res: Response) {
    try {
      const user_uuid = req.body.user_uuid;
      if (!user_uuid || typeof user_uuid !== "string") {
        return sendErrorResponse(res, 400, "User UUID is required");
      }

      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const result = await followService.getFollowers(user_uuid, page, limit);

      return sendPaginatedResponse(
        res,
        result.followers,
        result.pagination,
        "Followers retrieved successfully",
      );
    } catch (error: unknown) {
      const err = error as AppError;
      return sendErrorResponse(
        res,
        err.statusCode || 400,
        (error as Error).message,
      );
    }
  }

  // GET /api/users/following - Get users followed by user
  async getFollowing(req: Request, res: Response) {
    try {
      const user_uuid = req.body.user_uuid;
      if (!user_uuid || typeof user_uuid !== "string") {
        return sendErrorResponse(res, 400, "User UUID is required");
      }

      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const result = await followService.getFollowing(user_uuid, page, limit);

      return sendPaginatedResponse(
        res,
        result.following,
        result.pagination,
        "Following list retrieved successfully",
      );
    } catch (error: unknown) {
      const err = error as AppError;
      return sendErrorResponse(
        res,
        err.statusCode || 400,
        (error as Error).message,
      );
    }
  }

  // GET /api/users/is-following - Check if current user is following target
  async isFollowing(req: Request, res: Response) {
    try {
      const followerUuid = req.user?.user_uuid;
      if (!followerUuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const followingUuid = req.body.user_uuid;
      if (!followingUuid || typeof followingUuid !== "string") {
        return sendErrorResponse(res, 400, "User UUID is required");
      }

      const result = await followService.isFollowing(
        followerUuid,
        followingUuid,
      );
      return sendApiResponse(
        res,
        200,
        result,
        "Follow status retrieved successfully",
      );
    } catch (error: any) {
      const status = error.statusCode || 400;
      return sendErrorResponse(res, status, error.message);
    }
  }
}

export const userController = new UserController();
