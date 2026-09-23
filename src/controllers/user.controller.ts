import { Request, Response } from "express";
import { UpdateUserProfileDto } from "../dtos/user.dto";
import { userService } from "../services/user.service";
import {
  sendApiResponse,
  sendErrorResponse,
  sendPaginatedResponse,
} from "../utils/api.response";

export class UserController {
  // Get public profile by username with follower/following counts
  async getPublicProfile(req: Request, res: Response) {
    try {
      const { username } = req.params;

      if (!username || typeof username !== "string") {
        return sendErrorResponse(res, 400, "Username is required");
      }

      const user = await userService.getPublicProfile(username);

      return sendApiResponse(res, 200, { user }, "User profile fetched successfully");
    } catch (error: any) {
      const status = error.message === "User not found" ? 404 : 500;
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

      const user = await userService.updateProfile(req.user.user_uuid, req.body);

      return sendApiResponse(res, 200, { user }, "Profile updated successfully");
    } catch (error: any) {
      const status = error.message === "User not found" ? 404 : 500;
      return sendErrorResponse(res, status, error.message);
    }
  }
  //get all user list excluding the admins
  async getAllUsersList(req: Request, res: Response) {
    try {
      const page = Number(req.query.page);
      const limit = Number(req.query.limit);
      const { users, pagination } = await userService.getAllUsers(page, limit);

      return sendPaginatedResponse(
        res,
        users,
        pagination,
        "Users list fetched successfully",
      );
    } catch (err: any) {
      return sendErrorResponse(res, 500, err.message);
    }
  }
}

export const userController = new UserController();
