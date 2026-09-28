import { AppDataSource } from "../database/data-source";
import { User } from "../entities/user.entity";
import { Story } from "../entities/story.entity";
import { Comment } from "../entities/comment.entity";
import { Like } from "../entities/like.entity";
import { storyRepository } from "../repositories/story.repository";
import { commentRepository } from "../repositories/comment.repository";
import ApiError from "../utils/api.error";
import { STORY_STATUS } from "../config/constants";
import { PaginationMeta } from "../utils/api.response";

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
      submittedStories,
      rejectedStories,
      approvedStories,
    ] = await Promise.all([
      this.userRepository.count(),
      this.storyRepository.count(),
      this.commentRepository.count(),
      this.likeRepository.count(),
      this.storyRepository.count({ where: { status: STORY_STATUS.PUBLISHED } }),
      this.storyRepository.count({ where: { status: STORY_STATUS.DRAFT } }),
      this.storyRepository.count({ where: { status: STORY_STATUS.SUBMITTED } }),
      this.storyRepository.count({ where: { status: STORY_STATUS.REJECTED } }),
      this.storyRepository.count({ where: { status: STORY_STATUS.APPROVED } }),
    ]);

    return {
      users: { total: totalUsers },
      stories: {
        total: totalStories,
        published: publishedStories,
        draft: draftStories,
        submitted: submittedStories,
        rejected: rejectedStories,
        approved: approvedStories,
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
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder("user")
      .select([
        "user.id",
        "user.user_uuid",
        "user.email",
        "user.username",
        "user.full_name",
        "user.role",
        "user.avatar_url",
        "user.created_at",
        "user.updated_at",
      ])
      .orderBy("user.created_at", "DESC");

    if (options.search && options.search.trim().length > 0) {
      queryBuilder.where(
        "LOWER(user.username) LIKE :search OR LOWER(user.email) LIKE :search OR LOWER(user.full_name) LIKE :search",
        { search: `%${options.search.trim().toLowerCase()}%` }
      );
    }

    const [users, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit) || 1;
    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      currentPageTotal: users.length,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    };

    return { users, pagination };
  }

  /**
   * Moderate/update story status (approve, reject, publish, draft)
   */
  async updateStoryStatus(
    identifier: string,
    status: string,
    rejectionReason?: string
  ) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        identifier
      );

    let story = null;
    if (isUuid) {
      story = await storyRepository.findByUuid(identifier);
    }
    if (!story) {
      story = await storyRepository.findBySlug(identifier);
    }
    if (!story && !isNaN(Number(identifier))) {
      story = await storyRepository.findById(Number(identifier));
    }

    if (!story) {
      throw ApiError.notFound("Story not found");
    }

    story.status = status;
    if (status === STORY_STATUS.REJECTED && rejectionReason) {
      story.rejectionReason = rejectionReason;
    } else if (status !== STORY_STATUS.REJECTED) {
      story.rejectionReason = null as any;
    }

    if (status === STORY_STATUS.PUBLISHED && !story.published_at) {
      story.published_at = new Date();
    }

    await this.storyRepository.save(story);
    return story;
  }

  /**
   * Delete any story as admin
   */
  async deleteStory(identifier: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        identifier
      );

    let story = null;
    if (isUuid) {
      story = await storyRepository.findByUuid(identifier);
    }
    if (!story) {
      story = await storyRepository.findBySlug(identifier);
    }
    if (!story && !isNaN(Number(identifier))) {
      story = await storyRepository.findById(Number(identifier));
    }

    if (!story) {
      throw ApiError.notFound("Story not found");
    }

    await storyRepository.delete(story);
    return { success: true, message: "Story deleted successfully by administrator" };
  }
}

export const adminService = new AdminService();
