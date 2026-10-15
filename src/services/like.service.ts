import { likeRepository } from "../repositories/like.repository";
import { storyRepository } from "../repositories/story.repository";
import { followRepository } from "../repositories/follow.repository";
import ApiError from "../utils/api.error";
import { calculatePagination, IPaginatedResult } from "../utils/pagination";
import { STORY_STATUS, STORY_VISIBILITY, ROLES } from "../config/constants";
import { AppDataSource } from "../database/data-source";
import { Story } from "../entities/story.entity";

export class LikeService {
  private async checkStoryAccess(story: Story, user_uuid?: string, userRole?: string) {
    const isAuthor = Boolean(user_uuid && user_uuid === story.user_uuid);
    const isAdmin = userRole === ROLES.ADMIN;

    if (story.status !== STORY_STATUS.PUBLISHED && !isAuthor && !isAdmin) {
      throw ApiError.notFound("Story not found");
    }

    if (story.visibility === STORY_VISIBILITY.FOLLOWERS_ONLY && !isAuthor && !isAdmin) {
      if (!user_uuid) {
        throw ApiError.forbidden("This story is private and only available to followers. Please sign in.");
      }
      const follow = await followRepository.findFollow(user_uuid, story.user_uuid);
      if (!follow) {
        throw ApiError.forbidden("This story is private and only available to followers of this author.");
      }
    }
  }

  /**
   * Helper to resolve story by UUID
   */
  async resolveStory(story_uuid: string) {
    const story = await storyRepository.findByUuid(story_uuid);

    if (!story) {
      throw ApiError.notFound("Story not found");
    }

    return story;
  }

  /**
   * Like a story
   */
  async likeStory(storyIdentifier: string, user_uuid: string) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const story = await this.resolveStory(storyIdentifier);
      await this.checkStoryAccess(story, user_uuid);

      const existingLike = await likeRepository.findLikeAny(
        story.story_uuid,
        user_uuid,
        queryRunner.manager
      );

      if (existingLike) {
        if (existingLike.is_delete === 0) {
          // Already liked
          const likesCount = await likeRepository.countLikes(story.story_uuid, queryRunner.manager);
          await queryRunner.commitTransaction();
          return {
            liked: true,
            alreadyLiked: true,
            message: "You have already liked this story",
            likesCount,
          };
        } else {
          // Soft-deleted like - reactivate it
          await likeRepository.reactivateLike(existingLike.id, queryRunner.manager);
          const likesCount = await likeRepository.countLikes(story.story_uuid, queryRunner.manager);
          await queryRunner.commitTransaction();
          return {
            liked: true,
            alreadyLiked: false,
            message: "Story liked successfully",
            likesCount,
          };
        }
      }

      await likeRepository.addLike(story.story_uuid, user_uuid, queryRunner.manager);
      const likesCount = await likeRepository.countLikes(story.story_uuid, queryRunner.manager);

      await queryRunner.commitTransaction();
      return {
        liked: true,
        alreadyLiked: false,
        message: "Story liked successfully",
        likesCount,
      };
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Unlike a story
   */
  async unlikeStory(storyIdentifier: string, user_uuid: string) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const story = await this.resolveStory(storyIdentifier);
      await this.checkStoryAccess(story, user_uuid);

      const existingLike = await likeRepository.findLike(
        story.story_uuid,
        user_uuid,
        queryRunner.manager
      );

      if (!existingLike) {
        const likesCount = await likeRepository.countLikes(story.story_uuid, queryRunner.manager);
        await queryRunner.commitTransaction();
        return {
          unliked: false,
          message: "You have not liked this story",
          likesCount,
        };
      }

      await likeRepository.removeLike(story.story_uuid, user_uuid, queryRunner.manager);
      const likesCount = await likeRepository.countLikes(story.story_uuid, queryRunner.manager);

      await queryRunner.commitTransaction();
      return {
        unliked: true,
        message: "Story unliked successfully",
        likesCount,
      };
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Toggle like on a story
   */
  async toggleLike( user_uuid: string,storyIdentifier: string,) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const story = await this.resolveStory(storyIdentifier);
      await this.checkStoryAccess(story, user_uuid);

      const existingLike = await likeRepository.findLikeAny(
        story.story_uuid,
        user_uuid,
        queryRunner.manager
      );

      let liked = false;
      if (existingLike) {
        if (existingLike.is_delete === 0) {
          // Active like - soft delete it
          await likeRepository.removeLike(story.story_uuid, user_uuid, queryRunner.manager);
          liked = false;
        } else {
          // Soft-deleted like - reactivate it
          await likeRepository.reactivateLike(existingLike.id, queryRunner.manager);
          liked = true;
        }
      } else {
        // No like exists - create new one
        await likeRepository.addLike(story.story_uuid, user_uuid, queryRunner.manager);
        liked = true;
      }

      const likesCount = await likeRepository.countLikes(story.story_uuid, queryRunner.manager);

      await queryRunner.commitTransaction();
      return {
        liked,
        message: liked ? "Story liked successfully" : "Story unliked successfully",
        likesCount,
      };
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get paginated likes and total count for a story
   */
  async getStoryLikes(
    storyIdentifier: string,
    pageInput = 1,
    limitInput = 10,
    viewerUuid?: string,
    userRole?: string,
  ): Promise<IPaginatedResult<{ liked_at: Date; [key: string]: any }> & { story: { story_uuid: string; title: string; slug: string } }> {
    const story = await this.resolveStory(storyIdentifier);
    await this.checkStoryAccess(story, viewerUuid, userRole);

    const { page, limit } = calculatePagination(0, {
      page: pageInput,
      limit: limitInput,
    });

    const { likes, total } = await likeRepository.getStoryLikes(
      story.story_uuid,
      { page, limit }
    );

    const users = likes
      .filter((l) => l.user)
      .map((l) => {
        const { password, ...safeUser } = l.user;
        return {
          ...safeUser,
          liked_at: l.created_at,
        };
      });

    return {
      story: {
        story_uuid: story.story_uuid,
        title: story.title,
        slug: story.slug,
      },
      data: users,
      meta: calculatePagination(total, { page, limit }),
    };
  }

  /**
   * Get like status for current user on a story
   */
  async getStoryLikeStatus(user_uuid: string,storyIdentifier: string ) {
    const story = await this.resolveStory(storyIdentifier);
    await this.checkStoryAccess(story, user_uuid);

    const [like, likesCount] = await Promise.all([
      likeRepository.findLike(story.story_uuid, user_uuid),
      likeRepository.countLikes(story.story_uuid),
    ]);

    return {
      story_uuid: story.story_uuid,
      liked: !!like,
      likesCount,
    };
  }
}

export const likeService = new LikeService();
