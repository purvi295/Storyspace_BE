import { commentRepository } from "../repositories/comment.repository";
import { storyRepository } from "../repositories/story.repository";
import { followRepository } from "../repositories/follow.repository";
import { CreateCommentDto, UpdateCommentDto } from "../dtos/comment.dto";
import ApiError from "../utils/api.error";
import { STORY_STATUS, STORY_VISIBILITY, ROLES } from "../config/constants";
import { PaginationMeta } from "../utils/api.response";

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
   * Helper to resolve story by uuid, slug, or numeric id
   */
  async resolveStory(identifier: string) {
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
    const story = await this.resolveStory(storyIdentifier);
    await this.checkStoryAccess(story, user_uuid, userRole);

    const comment = await commentRepository.createComment({
      story_uuid: story.story_uuid,
      user_id: user_uuid,
      content: data.content,
    });

    if (comment.user) {
      const { password, ...safeUser } = comment.user;
      comment.user = safeUser as any;
    }

    return comment;
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

    const page = Number.isInteger(pageInput) && pageInput > 0 ? pageInput : 1;
    const limit =
      Number.isInteger(limitInput) && limitInput > 0
        ? Math.min(limitInput, 100)
        : 10;
    const skip = (page - 1) * limit;

    const { comments, total } = await commentRepository.findByStoryUuid(
      story.story_uuid,
      { skip, take: limit }
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

    const totalPages = Math.ceil(total / limit) || 1;
    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      currentPageTotal: safeComments.length,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    };

    return {
      story: {
        story_uuid: story.story_uuid,
        title: story.title,
        slug: story.slug,
      },
      comments: safeComments,
      pagination,
    };
  }

  /**
   * Get single comment by ID
   */
  async getCommentById(id: number) {
    const comment = await commentRepository.findById(id);

    if (!comment) {
      throw ApiError.notFound(`Comment with ID ${id} not found`);
    }

    if (comment.user) {
      const { password, ...safeUser } = comment.user;
      comment.user = safeUser as any;
    }

    return comment;
  }

  /**
   * Update own comment
   */
  async updateComment(
    id: number,
    user_uuid: string,
    data: UpdateCommentDto
  ) {
    const comment = await commentRepository.findById(id);

    if (!comment) {
      throw ApiError.notFound(`Comment with ID ${id} not found`);
    }

    if (comment.user_id !== user_uuid) {
      throw ApiError.forbidden("You are only allowed to edit your own comments");
    }

    const updatedComment = await commentRepository.updateComment(
      id,
      data.content
    );

    if (updatedComment?.user) {
      const { password, ...safeUser } = updatedComment.user;
      updatedComment.user = safeUser as any;
    }

    return updatedComment;
  }

  /**
   * Delete comment (comment author, story author, or admin)
   */
  async deleteComment(
    id: number,
    user_uuid: string,
    userRole: string
  ) {
    const comment = await commentRepository.findById(id);

    if (!comment) {
      throw ApiError.notFound(`Comment with ID ${id} not found`);
    }

    const isCommentAuthor = comment.user_id === user_uuid;
    const isAdmin = userRole === ROLES.ADMIN;
    const isStoryAuthor = comment.story?.user_uuid === user_uuid;

    if (!isCommentAuthor && !isAdmin && !isStoryAuthor) {
      throw ApiError.forbidden("You are not authorized to delete this comment");
    }

    await commentRepository.deleteComment(id);

    return {
      success: true,
      message: `Comment with ID ${id} was deleted successfully`,
    };
  }
}

export const commentService = new CommentService();
