import { Request, Response } from "express";
import { StoryService } from "../services/story.service";
import { sendApiResponse, sendErrorResponse, sendPaginatedResponse } from "../utils/api.response";
import { CreateStoryDto, UpdateStoryDto, StoryQueryDto } from "../dtos/story.dto";

export class StoryController {
  // POST /api/stories/create - Create a new story
  async createStory(req: Request<{}, unknown, CreateStoryDto>, res: Response) {
    try {
      const { title, slug, content, summary, coverImageUrl, status, visibility } = req.body;
      const user_uuid = req.user?.user_uuid;
      if (!user_uuid) {
        return sendErrorResponse(res, 401, "User not authenticated");
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
    } catch (error: any) {
      return sendErrorResponse(res, 400, error.message);
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
        result.stories,
        result.pagination,
        "Public stories fetched successfully"
      );
    } catch (error: any) {
      return sendErrorResponse(res, 500, error.message);
    }
  }

  // GET /api/stories/user/:username - Get stories by a specific user (no auth required)
  async getStoriesByUser(req: Request, res: Response) {
    try {
      const username = req.params.username as string;
      const query: StoryQueryDto = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        status: req.query.status as string,
      };
      
      const result = await StoryService.getStoriesByUser(username, query);
      return sendApiResponse(res, 200, result, "User stories fetched successfully");
    } catch (error: any) {
      const status = error.message === "User not found" ? 404 : 500;
      return sendErrorResponse(res, status, error.message);
    }
  }

  // GET /api/stories/slug/:slug - Get a single story by slug (no auth required)
  async getStoryBySlug(req: Request, res: Response) {
    try {
      const slug = req.params.slug as string;
      const story = await StoryService.getStoryBySlug(slug);
      return sendApiResponse(res, 200, { story }, "Story fetched successfully");
    } catch (error: any) {
      const status = error.message === "Story not found" ? 404 : 500;
      return sendErrorResponse(res, status, error.message);
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
        result.stories,
        result.pagination,
        "Your stories fetched successfully"
      );
    } catch (error: any) {
      return sendErrorResponse(res, 500, error.message);
    }
  }

  // GET /api/stories - Get all stories with filters (auth required)
  async getAllStories(req: Request, res: Response) {
    try {
      const query: StoryQueryDto = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        status: req.query.status as string,
        visibility: req.query.visibility as string,
        author: req.query.author as string,
      };
      
      const result = await StoryService.getAllStories(query);
      return sendPaginatedResponse(
        res,
        result.stories,
        result.pagination,
        "All stories fetched successfully"
      );
    } catch (error: any) {
      return sendErrorResponse(res, 500, error.message);
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

      const story = await StoryService.getStoryBySlug(slug);
      const updatedStory = await StoryService.updateStory(story, req.body, user_uuid);
      return sendApiResponse(res, 200, { story: updatedStory }, "Story updated successfully");
    } catch (error: any) {
      const status = error.message === "Story not found" ? 404 : 
                     error.message.includes("not authorized") ? 403 : 400;
      return sendErrorResponse(res, status, error.message);
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

      const story = await StoryService.getStoryBySlug(slug);
      const result = await StoryService.deleteStory(story, user_uuid);
      return sendApiResponse(res, 200, result, "Story deleted successfully");
    } catch (error: any) {
      const status = error.message === "Story not found" ? 404 : 
                     error.message.includes("not authorized") ? 403 : 400;
      return sendErrorResponse(res, status, error.message);
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
      return sendApiResponse(res, 200, { stats }, "Story statistics fetched successfully");
    } catch (error: any) {
      return sendErrorResponse(res, 500, error.message);
    }
  }
}

export const storyController = new StoryController();
