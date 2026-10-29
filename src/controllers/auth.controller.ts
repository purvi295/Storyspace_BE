// src/controllers/auth.controller.ts
// HTTP Controller for User Authentication, Token Refreshing, Profile, and Session Revocation

import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { LoginDto, RegisterDto } from "../dtos/auth.dto";
import { sendApiResponse, sendErrorResponse } from "../utils/api.response";
import { AppError } from "../utils/api.error";

export class AuthController {
  // Register new user (returns user profile, accessToken, and refreshToken)
  async register(req: Request<{}, unknown, RegisterDto>, res: Response) {
    try {
      const { email, password, username, full_name } = req.body;

      const result = await authService.register({
        email,
        password,
        username,
        full_name,
      });

      return sendApiResponse(res, 201, result, "User registered successfully");
    } catch (error: unknown) {
      const err = error as AppError;
      return sendErrorResponse(res, err.statusCode || 400, (error as Error).message);
    }
  }

  // Login user (returns user profile, accessToken, and refreshToken)
  async login(req: Request<{}, unknown, LoginDto>, res: Response) {
    try {
      const { email, password } = req.body;

      const result = await authService.login({ email, password });

      return sendApiResponse(res, 200, result, "Login successful");
    } catch (error: unknown) {
      const err = error as AppError;
      return sendErrorResponse(res, err.statusCode || 401, (error as Error).message);
    }
  }

  // Refresh access token using a valid Refresh Token (Token Rotation)
  async refresh(req: Request<{}, unknown, { refreshToken: string }>, res: Response) {
    try {
      const { refreshToken } = req.body;

      const result = await authService.refreshAccessToken(refreshToken);

      return sendApiResponse(res, 200, result, "Token refreshed successfully");
    } catch (error: unknown) {
      const err = error as AppError;
      return sendErrorResponse(res, err.statusCode || 401, (error as Error).message);
    }
  }

  // Get current authenticated user profile
  async me(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const user = await authService.getUserByUuid(req.user.user_uuid);

      if (!user) {
        return sendErrorResponse(res, 404, "User not found");
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;

      return sendApiResponse(res, 200, { user: userWithoutPassword }, "Current user fetched successfully");
    } catch (error: unknown) {
      const err = error as AppError;
      return sendErrorResponse(res, err.statusCode || 500, (error as Error).message);
    }
  }

  // Logout user and revoke refresh token
  async logout(req: Request<{}, unknown, { refreshToken?: string }>, res: Response) {
    try {
      if (!req.user) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const { refreshToken } = req.body || {};
      await authService.logout(req.user.user_uuid, refreshToken);

      return sendApiResponse(res, 200, null, "User logged out and session revoked successfully");
    } catch (error: unknown) {
      const err = error as AppError;
      return sendErrorResponse(res, err.statusCode || 500, (error as Error).message);
    }
  }
}

export const authController = new AuthController();
