import { AppDataSource } from "../database/data-source";
import { User } from "../entities/user.entity";
import { Story } from "../entities/story.entity";
import { Comment } from "../entities/comment.entity";
import { Like } from "../entities/like.entity";
import { storyRepository } from "../repositories/story.repository";
import { commentRepository } from "../repositories/comment.repository";
import { userRepository } from "../repositories/user.repository";
import ApiError from "../utils/api.error";
import { STORY_STATUS } from "../config/constants";
import { calculatePagination } from "../utils/pagination";

export class AdminService {
  private userRepository = AppDataSource.getRepository(User);
  private storyRepository = AppDataSource.getRepository(Story);
  private commentRepository = AppDataSource.getRepository(Comment);
  private likeRepository = AppDataSource.getRepository(Like);

  /**
   * Get platform-wide overview metrics
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
      this.userRepository.count(),
      this.storyRepository.count(),
      this.commentRepository.count(),
      this.likeRepository.count(),
      this.storyRepository.count({ where: { status: STORY_STATUS.PUBLISHED } }),
      this.storyRepository.count({ where: { status: STORY_STATUS.DRAFT } }),
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
  async listUsers(options: { page: number; limit: number; search?: string }) {
    const { page, limit } = calculatePagination(0, {
      page: options.page,
      limit: options.limit,
    });

    const { users, total } = await userRepository.getAllUsersWithSearch({
      page,
      limit,
      search: options.search,
    });

    return { users, pagination: calculatePagination(total, { page, limit }) };
  }

  /**
   * Delete any story as admin
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

      await storyRepository.delete(story, queryRunner.manager);

      await queryRunner.commitTransaction();
      return {
        message: "Story deleted successfully by administrator",
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
