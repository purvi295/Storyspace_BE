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
import { calculatePagination, IPaginatedResult } from "../utils/pagination";
import { AppDataSource } from "../database/data-source";

export class StoryService {
  static async createStory(user_uuid: string, storyData: CreateStoryDto) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { title } = storyData;

      // Check if story with this title already exists
      const existingStory = await storyRepository.findByTitle(
        title,
        queryRunner.manager,
      );

      if (existingStory) {
        throw ApiError.conflict("Story with this title already exists");
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

      // Check if story with this slug already exists
      const existingSlug = await storyRepository.findBySlug(
        slug,
        queryRunner.manager,
      );
      if (existingSlug) {
        throw ApiError.conflict(
          "A story with this title or slug already exists",
        );
      }

      const story = await storyRepository.create(
        {
          user_uuid,
          ...storyData,
          slug,
        },
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();
      return story;
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get all public published stories (for public reading)
   * Anyone can access this - no authentication required
   */
  static async getPublicStories(
    query: StoryQueryDto,
  ): Promise<IPaginatedResult<Story>> {
    const { page, limit } = calculatePagination(0, {
      page: query.page,
      limit: query.limit,
    });

    const { stories, total } = await storyRepository.findPublicPublishedStories(
      {
        page,
        limit,
      },
    );

    return {
      data: stories,
      meta: calculatePagination(total, { page, limit }),
    };
  }

  /**
   * Get stories by a specific user (user-wise stories)
   * Enforces visibility: non-followers only see public stories.
   */
  static async getStoriesByUser(
    user_uuid: string,
    query: StoryQueryDto,
    viewerUuid?: string,
    viewerRole?: string,
  ) {
    // Find user by UUID
    const cleanUuid = user_uuid ? user_uuid.trim() : "";
    const user = await userRepository.findByUuid(cleanUuid);
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    const isAuthor = Boolean(viewerUuid && viewerUuid === user.user_uuid);
    const isAdmin = viewerRole === ROLES.ADMIN;
    let isFollower = false;
    if (viewerUuid && !isAuthor && !isAdmin) {
      const follow = await followRepository.findFollow(
        viewerUuid,
        user.user_uuid,
      );
      isFollower = Boolean(follow);
    }

    // Only author, confirmed followers, or admin can see followers_only stories
    const canSeeFollowersOnly = isAuthor || isFollower || isAdmin;

    let allowedVisibilities: string[];
    if (canSeeFollowersOnly) {
      if (query.visibility) {
        allowedVisibilities = [query.visibility];
      } else {
        allowedVisibilities = [
          STORY_VISIBILITY.PUBLIC,
          STORY_VISIBILITY.FOLLOWERS_ONLY,
        ];
      }
    } else {
      // Non-followers and unauthenticated viewers can ONLY see public stories
      allowedVisibilities = [STORY_VISIBILITY.PUBLIC];
    }

    // Only author or admin can see non-published stories (e.g. draft, submitted)
    const status =
      (isAuthor || isAdmin) && query.status
        ? query.status
        : STORY_STATUS.PUBLISHED;

    const { page, limit } = calculatePagination(0, {
      page: query.page,
      limit: query.limit,
    });

    const { stories, total } = await storyRepository.findStoriesByUser({
      user_uuid: user.user_uuid,
      page,
      limit,
      status,
      allowedVisibilities,
    });

    return {
      author: {
        username: user.username,
        full_name: user.full_name,
        user_uuid: user.user_uuid,
      },
      data: stories,
      meta: calculatePagination(total, { page, limit }),
    };
  }

  /**
   * Get all stories with filters (for authenticated users)
   * Follower-only stories are filtered so users only see stories from authors they follow (or themselves).
   */
  static async getAllStories(
    query: StoryQueryDto,
    currentUserUuid?: string,
    userRole?: string,
  ): Promise<IPaginatedResult<Story>> {
    const isAdmin = userRole === ROLES.ADMIN;

    const { page, limit } = calculatePagination(0, {
      page: query.page,
      limit: query.limit,
    });

    const { stories, total } = await storyRepository.findAllWithFilters({
      page,
      limit,
      status: query.status,
      visibility: query.visibility,
      author: query.author,
      currentUserUuid: isAdmin ? undefined : currentUserUuid,
      isAdmin,
    });

    return {
      data: stories,
      meta: calculatePagination(total, { page, limit }),
    };
  }

  /**
   * Get a single story by slug
   * Enforces that followers_only stories are only accessible to followers, author, or admin.
   */
  static async getStoryBySlug(
    slug: string,
    viewerUuid?: string,
    viewerRole?: string,
  ) {
    const story = await storyRepository.findBySlug(slug);
    if (!story) {
      throw ApiError.notFound("Story not found");
    }

    const isOwner = Boolean(viewerUuid && viewerUuid === story.user_uuid);
    const isAdmin = viewerRole === ROLES.ADMIN;

    // Only the author or admin can see non-published stories (e.g. draft, submitted, rejected)
    if (story.status !== STORY_STATUS.PUBLISHED && !isOwner && !isAdmin) {
      throw ApiError.notFound("Story not found");
    }

    // If the story is followers_only, check access
    if (
      story.visibility === STORY_VISIBILITY.FOLLOWERS_ONLY &&
      !isOwner &&
      !isAdmin
    ) {
      if (!viewerUuid) {
        throw ApiError.forbidden(
          "This story is only available to followers. Please login and follow this user to view it.",
        );
      }

      const follow = await followRepository.findFollow(
        viewerUuid,
        story.user_uuid,
      );
      if (!follow) {
        throw ApiError.forbidden(
          "This story is only available to followers. Please follow this user to view it.",
        );
      }
    }

    return story;
  }

  /**
   * Get current user's stories (my stories)
   */
  static async getMyStories(
    user_uuid: string,
    query: StoryQueryDto,
  ): Promise<IPaginatedResult<Story>> {
    const { page, limit } = calculatePagination(0, {
      page: query.page,
      limit: query.limit,
    });

    const { stories, total } = await storyRepository.findStoriesByUser({
      user_uuid,
      page,
      limit,
      status: query.status,
    });

    return {
      data: stories,
      meta: calculatePagination(total, { page, limit }),
    };
  }

  /**
   * Update a story
   */
  static async updateStory(
    story: Story,
    storyData: UpdateStoryDto,
    user_uuid: string,
  ) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if the user is the author of the story
      if (story.user_uuid !== user_uuid) {
        throw ApiError.forbidden("You are not authorized to update this story");
      }

      // If title is being updated, check for duplicate
      if (storyData.title && storyData.title !== story.title) {
        const existingStory = await storyRepository.findByTitle(
          storyData.title,
          queryRunner.manager,
        );
        if (existingStory && existingStory.story_uuid !== story.story_uuid) {
          throw ApiError.conflict("Story with this title already exists");
        }

        // Auto-generate new slug if title changes
        const newSlug = slugify(storyData.title);
        if (newSlug && newSlug.length > 0) {
          storyData.slug = newSlug;
        }
      }

      await storyRepository.update(story, storyData, queryRunner.manager);

      // Re-fetch using the immutable story_uuid — storyData.slug is optional,
      // so looking up by slug could return null when no slug was provided.
      const updatedStory = await storyRepository.findByUuid(
        story.story_uuid,
        queryRunner.manager,
      );
      if (!updatedStory) {
        throw ApiError.notFound("Story not found after update");
      }

      await queryRunner.commitTransaction();
      return updatedStory;
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Delete a story
   */
  static async deleteStory(story: Story, user_uuid: string) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if the user is the author of the story
      if (story.user_uuid !== user_uuid) {
        throw ApiError.forbidden("You are not authorized to delete this story");
      }

      await storyRepository.delete(story, queryRunner.manager);

      await queryRunner.commitTransaction();
      return { message: "Story deleted successfully" };
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get story statistics for a user
   */
  static async getUserStoryStats(user_uuid: string) {
    const [totalStories, draftCount, publishedCount] = await Promise.all([
      storyRepository.getStoryCountByUser(user_uuid),
      storyRepository.getStoryCountByUserAndStatus(
        user_uuid,
        STORY_STATUS.DRAFT,
      ),
      storyRepository.getStoryCountByUserAndStatus(
        user_uuid,
        STORY_STATUS.PUBLISHED,
      ),
    ]);

    return {
      totalStories,
      draftCount,
      publishedCount,
    };
  }
}
export const storyService = new StoryService();
