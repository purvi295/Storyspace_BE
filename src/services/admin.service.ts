import { AppDataSource } from "../database/data-source";
import { User } from "../entities/user.entity";
import { Story } from "../entities/story.entity";
import { Comment } from "../entities/comment.entity";
import { Like } from "../entities/like.entity";
import { storyRepository } from "../repositories/story.repository";
import { commentRepository } from "../repositories/comment.repository";
import { likeRepository } from "../repositories/like.repository";
import { userRepository } from "../repositories/user.repository";
import ApiError from "../utils/api.error";
import { STORY_STATUS } from "../config/constants";
import { calculatePagination, IPaginatedResult } from "../utils/pagination";

export class AdminService {
  private userRepo = AppDataSource.getRepository(User);
  private storyRepo = AppDataSource.getRepository(Story);
  private commentRepo = AppDataSource.getRepository(Comment);
  private likeRepo = AppDataSource.getRepository(Like);

  /**
   * Get platform-wide overview metrics (excluding soft-deleted rows)
   */
  async getPlatformStats() {
    const [
      totalUsers,
      totalStories,
      totalComments,
      totalLikes,
      publishedStories,
      draftStories,
    ] = await Promise.all([
      this.userRepo.count({ where: { is_delete: 0 } }),
      this.storyRepo.count({ where: { is_delete: 0 } }),
      this.commentRepo.count({ where: { is_delete: 0 } }),
      this.likeRepo.count({ where: { is_delete: 0 } }),
      this.storyRepo.count({
        where: { status: STORY_STATUS.PUBLISHED, is_delete: 0 },
      }),
      this.storyRepo.count({
        where: { status: STORY_STATUS.DRAFT, is_delete: 0 },
      }),
    ]);

    return {
      users: { total: totalUsers },
      stories: {
        total: totalStories,
        published: publishedStories,
        draft: draftStories,
      },
      engagement: {
        totalComments,
        totalLikes,
      },
    };
  }

  /**
   * List all users with pagination and optional search (for admin panel)
   */
  async listUsers(options: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<IPaginatedResult<Partial<User>>> {
    const { users, total } = await userRepository.getAllUsersWithSearch({
      page: options.page,
      limit: options.limit,
      search: options.search,
    });

    return {
      data: users,
      meta: calculatePagination(total, {
        page: options.page,
        limit: options.limit,
      }),
    };
  }

  /**
   * Soft delete any story as admin (cascading soft-delete to comments & likes within transaction)
   */
  async deleteStory(story_uuid: string) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const story = await storyRepository.findByUuid(
        story_uuid,
        queryRunner.manager,
      );

      if (!story) {
        throw ApiError.notFound("Story not found");
      }

      // 1. Soft-delete the story
      await storyRepository.delete(story, queryRunner.manager);

      // 2. Cascade soft-delete associated comments and likes
      await commentRepository.deleteByStoryUuid(story_uuid, queryRunner.manager);
      await likeRepository.deleteByStoryUuid(story_uuid, queryRunner.manager);

      await queryRunner.commitTransaction();
      return {
        message: "Story and its engagements deleted successfully by administrator",
      };
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

export const adminService = new AdminService();
