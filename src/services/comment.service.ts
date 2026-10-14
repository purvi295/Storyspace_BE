import { commentRepository } from "../repositories/comment.repository";
import { storyRepository } from "../repositories/story.repository";
import { followRepository } from "../repositories/follow.repository";
import { CreateCommentDto, UpdateCommentDto } from "../dtos/comment.dto";
import ApiError from "../utils/api.error";
import { STORY_STATUS, STORY_VISIBILITY, ROLES, PAGINATION } from "../config/constants";
import { calculatePagination } from "../utils/pagination";
import { User } from "../entities/user.entity";
import { AppDataSource } from "../database/data-source";

type UserWithoutPassword = Omit<User, 'password'>;

export class CommentService {
  private async checkStoryAccess(story: any, user_uuid?: string, userRole?: string) {
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
   * Add a new comment to a story
   */
  async addComment(
    storyIdentifier: string,
    user_uuid: string,
    data: CreateCommentDto,
    userRole?: string
  ) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const story = await this.resolveStory(storyIdentifier);
      await this.checkStoryAccess(story, user_uuid, userRole);

      const comment = await commentRepository.createComment({
        story_uuid: story.story_uuid,
        user_id: user_uuid,
        content: data.content,
      }, queryRunner.manager);

      if (comment.user) {
        const { password, ...safeUser } = comment.user;
        (comment.user as unknown as UserWithoutPassword) = safeUser;
      }

      await queryRunner.commitTransaction();
      return comment;
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get paginated comments for a story
   */
  async getStoryComments(
    storyIdentifier: string,
    pageInput = 1,
    limitInput = 10,
    viewerUuid?: string,
    userRole?: string
  ) {
    const story = await this.resolveStory(storyIdentifier);
    await this.checkStoryAccess(story, viewerUuid, userRole);

    const { page, limit } = calculatePagination(0, {
      page: pageInput,
      limit: limitInput,
    });

    const { comments, total } = await commentRepository.findByStoryUuid(
      story.story_uuid,
      { page, limit }
    );

    const safeComments = comments.map((comment) => {
      if (comment.user) {
        const { password, ...safeUser } = comment.user;
        return {
          ...comment,
          user: safeUser,
        };
      }
      return comment;
    });

    return {
      story: {
        story_uuid: story.story_uuid,
        title: story.title,
        slug: story.slug,
      },
      comments: safeComments,
      pagination: calculatePagination(total, { page, limit }),
    };
  }

  /**
   * Get single comment by UUID
   */
  async getCommentById(comment_uuid: string) {
    const comment = await commentRepository.findByUuid(comment_uuid);

    if (!comment) {
      throw ApiError.notFound(`Comment with UUID ${comment_uuid} not found`);
    }

    if (comment.user) {
      const { password, ...safeUser } = comment.user;
      (comment.user as unknown as UserWithoutPassword) = safeUser;
    }

    return comment;
  }

  /**
   * Update own comment
   */
  async updateComment(
    comment_uuid: string,
    user_uuid: string,
    data: UpdateCommentDto
  ) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const comment = await commentRepository.findByUuid(comment_uuid, queryRunner.manager);

      if (!comment) {
        throw ApiError.notFound(`Comment with UUID ${comment_uuid} not found`);
      }

      if (comment.user_id !== user_uuid) {
        throw ApiError.forbidden("You are only allowed to edit your own comments");
      }

      const updatedComment = await commentRepository.updateComment(
        comment_uuid,
        data.content,
        queryRunner.manager
      );

      if (updatedComment?.user) {
        const { password, ...safeUser } = updatedComment.user;
        (updatedComment.user as unknown as UserWithoutPassword) = safeUser;
      }

      await queryRunner.commitTransaction();
      return updatedComment;
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Delete comment (comment author, story author, or admin)
   */
  async deleteComment(
    comment_uuid: string,
    user_uuid: string,
    userRole: string
  ) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const comment = await commentRepository.findByUuid(comment_uuid, queryRunner.manager);

      if (!comment) {
        throw ApiError.notFound(`Comment with UUID ${comment_uuid} not found`);
      }

      const isCommentAuthor = comment.user_id === user_uuid;
      const isAdmin = userRole === ROLES.ADMIN;
      const isStoryAuthor = comment.story?.user_uuid === user_uuid;

      if (!isCommentAuthor && !isAdmin && !isStoryAuthor) {
        throw ApiError.forbidden("You are not authorized to delete this comment");
      }

      await commentRepository.deleteComment(comment_uuid, queryRunner.manager);

      await queryRunner.commitTransaction();
      return {
        success: true,
        message: `Comment with UUID ${comment_uuid} was deleted successfully`,
      };
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

export const commentService = new CommentService();
