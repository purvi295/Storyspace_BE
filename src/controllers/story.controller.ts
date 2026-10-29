import { Request, Response } from "express";
import { StoryService } from "../services/story.service";
import { storageService } from "../services/storage.service";
import {
  sendApiResponse,
  sendErrorResponse,
  sendPaginatedResponse,
} from "../utils/api.response";
import { AppError } from "../utils/api.error";
import {
  CreateStoryDto,
  UpdateStoryDto,
  StoryQueryDto,
} from "../dtos/story.dto";

export class StoryController {
  // POST /api/stories/create - Create a new story
  async createStory(req: Request<{}, unknown, CreateStoryDto>, res: Response) {
    try {
      const { title, slug, content, summary, status, visibility } = req.body;
      const user_uuid = req.user?.user_uuid;
      if (!user_uuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      // If a file was uploaded in multipart/form-data, upload it to storage
      let coverImageUrl =
        req.body.coverImageUrl ||
        (req.body as any).cover_image_url ||
        (req.body as any).coverImage ||
        (req.body as any).cover_image ||
        (req.body as any).image ||
        (req.body as any).imageUrl;

      if (req.file) {
        const uploadResult = await storageService.uploadImage(
          req.file,
          "stories",
        );
        coverImageUrl = uploadResult.url;
      }

      const story = await StoryService.createStory(user_uuid, {
        title,
        slug,
        content,
        summary,
        coverImageUrl,
        status,
        visibility,
      });
      return sendApiResponse(res, 201, story, "Story created successfully");
    } catch (error: unknown) {
      const err = error as AppError;
      return sendErrorResponse(
        res,
        err.statusCode || 400,
        (error as Error).message,
      );
    }
  }

  // GET /api/stories/public - Get all public published stories (no auth required)
  async getPublicStories(req: Request, res: Response) {
    try {
      const query: StoryQueryDto = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };

      const result = await StoryService.getPublicStories(query);
      return sendPaginatedResponse(
        res,
        result,
        "Public stories fetched successfully",
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

  // GET /api/stories/user/:user_uuid - Get stories by user_uuid (optional auth)
  async getStoriesByUser(req: Request, res: Response) {
    try {
      const user_uuid = (req.params.user_uuid ||
        req.params.username ||
        req.params.target) as string;
      const query: StoryQueryDto = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        status: req.query.status as string,
        visibility: req.query.visibility as string,
      };

      const result = await StoryService.getStoriesByUser(
        user_uuid,
        query,
        req.user?.user_uuid,
        req.user?.role,
      );
      return sendPaginatedResponse(
        res,
        result,
        "User stories fetched successfully",
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

  // GET /api/stories/slug/:slug - Get a single story by slug (optional auth)
  async getStoryBySlug(req: Request, res: Response) {
    try {
      const slug = req.params.slug as string;
      const story = await StoryService.getStoryBySlug(
        slug,
        req.user?.user_uuid,
        req.user?.role,
      );
      return sendApiResponse(res, 200, { story }, "Story fetched successfully");
    } catch (error: unknown) {
      const err = error as AppError;
      return sendErrorResponse(
        res,
        err.statusCode || 500,
        (error as Error).message,
      );
    }
  }

  // GET /api/stories/my - Get current user's stories (auth required)
  async getMyStories(req: Request, res: Response) {
    try {
      const user_uuid = req.user?.user_uuid;
      if (!user_uuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const query: StoryQueryDto = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        status: req.query.status as string,
      };

      const result = await StoryService.getMyStories(user_uuid, query);
      return sendPaginatedResponse(
        res,
        result,
        "Your stories fetched successfully",
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

  // GET /api/stories - Get all stories with filters (auth required)
  async getAllStories(req: Request, res: Response) {
    try {
      const user_uuid = req.user?.user_uuid;
      if (!user_uuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const query: StoryQueryDto = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        status: req.query.status as string,
        visibility: req.query.visibility as string,
        author: req.query.author as string,
      };

      const result = await StoryService.getAllStories(
        query,
        user_uuid,
        req.user?.role,
      );
      return sendPaginatedResponse(
        res,
        result,
        "All stories fetched successfully",
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

  // PUT /api/stories/:slug - Update a story (auth required)
  async updateStory(req: Request, res: Response) {
    try {
      const slug = req.params.slug as string;
      const user_uuid = req.user?.user_uuid;

      if (!user_uuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const updatePayload: UpdateStoryDto = { ...req.body };

      let coverImageUrl =
        req.body.coverImageUrl ||
        req.body.cover_image_url ||
        req.body.coverImage ||
        req.body.cover_image ||
        req.body.image ||
        req.body.imageUrl;

      if (req.file) {
        const uploadResult = await storageService.uploadImage(
          req.file,
          "stories",
        );
        coverImageUrl = uploadResult.url;
      }

      if (coverImageUrl !== undefined) {
        updatePayload.coverImageUrl = coverImageUrl;
      }

      const story = await StoryService.getStoryBySlug(slug, user_uuid);
      const updatedStory = await StoryService.updateStory(
        story,
        updatePayload,
        user_uuid,
      );
      return sendApiResponse(
        res,
        200,
        { story: updatedStory },
        "Story updated successfully",
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

  // DELETE /api/stories/:slug - Delete a story (auth required)
  async deleteStory(req: Request, res: Response) {
    try {
      const slug = req.params.slug as string;
      const user_uuid = req.user?.user_uuid;

      if (!user_uuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const story = await StoryService.getStoryBySlug(slug, user_uuid);
      const result = await StoryService.deleteStory(story, user_uuid);
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

  // GET /api/stories/stats/my - Get current user's story statistics (auth required)
  async getMyStoryStats(req: Request, res: Response) {
    try {
      const user_uuid = req.user?.user_uuid;
      if (!user_uuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
      }

      const stats = await StoryService.getUserStoryStats(user_uuid);
      return sendApiResponse(
        res,
        200,
        { stats },
        "Story statistics fetched successfully",
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
}

export const storyController = new StoryController();
