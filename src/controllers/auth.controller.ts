import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { EditAuthProfileDto, LoginDto, RegisterDto } from "../dtos/auth.dto";
import { sendApiResponse, sendErrorResponse } from "../utils/api.response";

export class AuthController {
  // Register new user
  async register(req: Request<{}, unknown, RegisterDto>, res: Response) {
    try {
      const { email, password, username } = req.body;
      const fullName = req.body.fullName || (req.body as any).full_name;

      const result = await authService.register({
        email,
        password,
        username,
        fullName,
      });

      return sendApiResponse(res, 201, result, "User registered successfully");
    } catch (error: any) {
      return sendErrorResponse(res, 400, error.message);
    }
  }

  // Login user
  async login(req: Request<{}, unknown, LoginDto>, res: Response) {
    try {
      const { email, password } = req.body;

      const result = await authService.login({ email, password });

      return sendApiResponse(res, 200, result, "Login successful");
    } catch (error: any) {
      return sendErrorResponse(res, 401, error.message);
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
    } catch (error: any) {
      return sendErrorResponse(res, 500, error.message);
    }
  }

  async editProfile(req: Request<{}, unknown, EditAuthProfileDto>, res: Response) {
    try {
      if (!req.user) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const user = await authService.editProfile(req.user.user_uuid, req.body);
      const { password, ...userWithoutPassword } = user;

      return sendApiResponse(res, 200, { user: userWithoutPassword }, "Profile updated successfully");
    } catch (error: any) {
      const status = error.message === "User not found" ? 404 : 500;
      return sendErrorResponse(res, status, error.message);
    }
  }
}

export const authController = new AuthController();
