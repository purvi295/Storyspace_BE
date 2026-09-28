import { Story } from "../entities/story.entity";
import {
  CreateStoryDto,
  UpdateStoryDto,
  StoryQueryDto,
} from "../dtos/story.dto";
import { storyRepository } from "../repositories/story.repository";
import { userRepository } from "../repositories/user.repository";
import { followRepository } from "../repositories/follow.repository";
import { slugify, generateUniqueSlug } from "../utils/slugify";
import ApiError from "../utils/api.error";
import { STORY_STATUS, STORY_VISIBILITY, ROLES } from "../config/constants";

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
   * Enforces visibility: non-followers only see public stories.
   */
  static async getStoriesByUser(username: string, query: StoryQueryDto, viewerUuid?: string, viewerRole?: string) {
    // Find user by username
    const user = await userRepository.findByUsername(username);
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 10;
    const skip = (page - 1) * limit;

    const isAuthor = Boolean(viewerUuid && viewerUuid === user.user_uuid);
    const isAdmin = viewerRole === ROLES.ADMIN;
    let isFollower = false;
    if (viewerUuid && !isAuthor && !isAdmin) {
      const follow = await followRepository.findFollow(viewerUuid, user.user_uuid);
      isFollower = Boolean(follow);
    }

    // Only author, confirmed followers, or admin can see followers_only stories
    const canSeeFollowersOnly = isAuthor || isFollower || isAdmin;

    let allowedVisibilities: string[];
    if (canSeeFollowersOnly) {
      if (query.visibility) {
        allowedVisibilities = [query.visibility];
      } else {
        allowedVisibilities = [STORY_VISIBILITY.PUBLIC, STORY_VISIBILITY.FOLLOWERS_ONLY];
      }
    } else {
      // Non-followers and unauthenticated viewers can ONLY see public stories
      allowedVisibilities = [STORY_VISIBILITY.PUBLIC];
    }

    // Only author or admin can see non-published stories (e.g. draft, submitted)
    const status = (isAuthor || isAdmin) && query.status ? query.status : STORY_STATUS.PUBLISHED;

    const { stories, total } = await storyRepository.findStoriesByUser({
      user_uuid: user.user_uuid,
      skip,
      take: limit,
      status,
      allowedVisibilities,
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
   * Follower-only stories are filtered so users only see stories from authors they follow (or themselves).
   */
  static async getAllStories(query: StoryQueryDto, currentUserUuid?: string, userRole?: string) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 10;
    const skip = (page - 1) * limit;

    const isAdmin = userRole === ROLES.ADMIN;

    const { stories, total } = await storyRepository.findAllWithFilters({
      skip,
      take: limit,
      status: query.status,
      visibility: query.visibility,
      author: query.author,
      currentUserUuid: isAdmin ? undefined : currentUserUuid,
      isAdmin,
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
   * Enforces that followers_only stories are only accessible to followers, author, or admin.
   */
  static async getStoryBySlug(slug: string, viewerUuid?: string, viewerRole?: string) {
    const story = await storyRepository.findBySlug(slug);
    if (!story) {
      throw ApiError.notFound("Story not found");
    }

    const isAuthor = Boolean(viewerUuid && viewerUuid === story.user_uuid);
    const isAdmin = viewerRole === ROLES.ADMIN;

    // Only the author or admin can see non-published stories (e.g. draft, submitted, rejected)
    if (story.status !== STORY_STATUS.PUBLISHED && !isAuthor && !isAdmin) {
      throw ApiError.notFound("Story not found");
    }

    // If the story is followers_only, check access
    if (story.visibility === STORY_VISIBILITY.FOLLOWERS_ONLY && !isAuthor && !isAdmin) {
      if (!viewerUuid) {
        throw ApiError.forbidden("This story is private and only available to followers. Please sign in.");
      }

      const follow = await followRepository.findFollow(viewerUuid, story.user_uuid);
      if (!follow) {
        throw ApiError.forbidden("This story is private and only available to followers of this author.");
      }
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
