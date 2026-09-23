import { Story } from "../entities/story.entity";
import {
  CreateStoryDto,
  UpdateStoryDto,
  StoryQueryDto,
} from "../dtos/story.dto";
import { storyRepository } from "../repositories/story.repository";
import { userRepository } from "../repositories/user.repository";
import { slugify, generateUniqueSlug } from "../utils/slugify";
import ApiError from "../utils/api.error";
import { STORY_STATUS } from "../config/constants";

export class StoryService {
  static async createStory(user_uuid: string, storyData: CreateStoryDto) {
    try {
      const { title } = storyData;

      // Check if story with this title already exists
      const existingStory = await storyRepository.findByTitle(title);

      if (existingStory) {
        throw new Error("Story with this title already exists");
      }
      // Auto-generate slug from title if not provided
      let slug = storyData.slug || slugify(storyData.title);

      // Ensure slug is not empty after slugification
      if (!slug || slug.length === 0) {
        throw new ApiError(
          400,
          "Unable to generate slug from title. Please provide a valid title or slug.",
        );
      }

      const story = await storyRepository.create({
        user_uuid,
        ...storyData,
        slug,
      });
      return story;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get all public published stories (for public reading)
   * Anyone can access this - no authentication required
   */
  static async getPublicStories(query: StoryQueryDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 10;
    const skip = (page - 1) * limit;

    const { stories, total } =
      await storyRepository.findPublicPublishedStories({
        skip,
        take: limit,
      });

    return {
      stories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        nextPage: page < Math.ceil(total / limit) ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
      },
    };
  }

  /**
   * Get stories by a specific user (user-wise stories)
   * Public endpoint - anyone can view a user's published stories
   */
  static async getStoriesByUser(username: string, query: StoryQueryDto) {
    // Find user by username
    const user = await userRepository.findByUsername(username);
    if (!user) {
      throw new Error("User not found");
    }

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 10;
    const skip = (page - 1) * limit;

    // For public access, only show published stories
    const status = query.status || STORY_STATUS.PUBLISHED;

    const { stories, total } = await storyRepository.findStoriesByUser({
      user_uuid: user.user_uuid,
      skip,
      take: limit,
      status,
    });

    return {
      author: {
        username: user.username,
        full_name: user.full_name,
        user_uuid: user.user_uuid,
      },
      stories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        nextPage: page < Math.ceil(total / limit) ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
      },
    };
  }

  /**
   * Get all stories with filters (for authenticated users)
   */
  static async getAllStories(query: StoryQueryDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 10;
    const skip = (page - 1) * limit;

    const { stories, total } = await storyRepository.findAllWithFilters({
      skip,
      take: limit,
      status: query.status,
      visibility: query.visibility,
      author: query.author,
    });

    return {
      stories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        nextPage: page < Math.ceil(total / limit) ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
      },
    };
  }

  /**
   * Get a single story by slug
   */
  static async getStoryBySlug(slug: string) {
    const story = await storyRepository.findBySlug(slug);
    if (!story) {
      throw new Error("Story not found");
    }
    return story;
  }

  /**
   * Get current user's stories (my stories)
   */
  static async getMyStories(user_uuid: string, query: StoryQueryDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 10;
    const skip = (page - 1) * limit;

    const { stories, total } = await storyRepository.findStoriesByUser({
      user_uuid,
      skip,
      take: limit,
      status: query.status,
    });

    return {
      stories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        nextPage: page < Math.ceil(total / limit) ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
      },
    };
  }

  /**
   * Update a story
   */
  static async updateStory(story: Story, storyData: UpdateStoryDto, user_uuid: string) {
    // Check if the user is the author of the story
    if (story.user_uuid !== user_uuid) {
      throw new Error("You are not authorized to update this story");
    }

    // If title is being updated, check for duplicate
    if (storyData.title && storyData.title !== story.title) {
      const existingStory = await storyRepository.findByTitle(storyData.title);
      if (existingStory && existingStory.story_uuid !== story.story_uuid) {
        throw new Error("Story with this title already exists");
      }

      // Auto-generate new slug if title changes
      const newSlug = slugify(storyData.title);
      if (newSlug && newSlug.length > 0) {
        storyData.slug = newSlug;
      }
    }

    await storyRepository.update(story, storyData);
    return await storyRepository.findBySlug(story.slug);
  }

  /**
   * Delete a story
   */
  static async deleteStory(story: Story, user_uuid: string) {
    // Check if the user is the author of the story
    if (story.user_uuid !== user_uuid) {
      throw new Error("You are not authorized to delete this story");
    }

    await storyRepository.delete(story);
    return { message: "Story deleted successfully" };
  }

  /**
   * Get story statistics for a user
   */
  static async getUserStoryStats(user_uuid: string) {
    const totalStories = await storyRepository.getStoryCountByUser(user_uuid);
    
    // Get counts by status
    const draftCount = await storyRepository.findStoriesByUser({
      user_uuid,
      skip: 0,
      take: 0,
      status: STORY_STATUS.DRAFT,
    }).then(result => result.total);

    const publishedCount = await storyRepository.findStoriesByUser({
      user_uuid,
      skip: 0,
      take: 0,
      status: STORY_STATUS.PUBLISHED,
    }).then(result => result.total);

    return {
      totalStories,
      draftCount,
      publishedCount,
    };
  }
}
export const storyService = new StoryService();
