import { likeRepository } from "../repositories/like.repository";
import { storyRepository } from "../repositories/story.repository";
import ApiError from "../utils/api.error";
import { PaginationMeta } from "../utils/api.response";

export class LikeService {
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
   * Like a story
   */
  async likeStory(storyIdentifier: string, user_uuid: string) {
    const story = await this.resolveStory(storyIdentifier);

    const existingLike = await likeRepository.findLike(
      story.story_uuid,
      user_uuid
    );

    if (existingLike) {
      const likesCount = await likeRepository.countLikes(story.story_uuid);
      return {
        liked: true,
        alreadyLiked: true,
        message: "You have already liked this story",
        likesCount,
      };
    }

    await likeRepository.addLike(story.story_uuid, user_uuid);
    const likesCount = await likeRepository.countLikes(story.story_uuid);

    return {
      liked: true,
      alreadyLiked: false,
      message: "Story liked successfully",
      likesCount,
    };
  }

  /**
   * Unlike a story
   */
  async unlikeStory(storyIdentifier: string, user_uuid: string) {
    const story = await this.resolveStory(storyIdentifier);

    const existingLike = await likeRepository.findLike(
      story.story_uuid,
      user_uuid
    );

    if (!existingLike) {
      const likesCount = await likeRepository.countLikes(story.story_uuid);
      return {
        unliked: false,
        message: "You have not liked this story",
        likesCount,
      };
    }

    await likeRepository.removeLike(story.story_uuid, user_uuid);
    const likesCount = await likeRepository.countLikes(story.story_uuid);

    return {
      unliked: true,
      message: "Story unliked successfully",
      likesCount,
    };
  }

  /**
   * Toggle like on a story
   */
  async toggleLike(storyIdentifier: string, user_uuid: string) {
    const story = await this.resolveStory(storyIdentifier);

    const existingLike = await likeRepository.findLike(
      story.story_uuid,
      user_uuid
    );

    let liked = false;
    if (existingLike) {
      await likeRepository.removeLike(story.story_uuid, user_uuid);
      liked = false;
    } else {
      await likeRepository.addLike(story.story_uuid, user_uuid);
      liked = true;
    }

    const likesCount = await likeRepository.countLikes(story.story_uuid);

    return {
      liked,
      message: liked ? "Story liked successfully" : "Story unliked successfully",
      likesCount,
    };
  }

  /**
   * Get paginated likes and total count for a story
   */
  async getStoryLikes(storyIdentifier: string, pageInput = 1, limitInput = 10) {
    const story = await this.resolveStory(storyIdentifier);

    const page = Number.isInteger(pageInput) && pageInput > 0 ? pageInput : 1;
    const limit =
      Number.isInteger(limitInput) && limitInput > 0
        ? Math.min(limitInput, 100)
        : 10;
    const skip = (page - 1) * limit;

    const { likes, total } = await likeRepository.getStoryLikes(
      story.story_uuid,
      { skip, take: limit }
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

    return {
      story: {
        story_uuid: story.story_uuid,
        title: story.title,
        slug: story.slug,
      },
      likes: users,
      pagination,
    };
  }

  /**
   * Get like status for current user on a story
   */
  async getStoryLikeStatus(storyIdentifier: string, user_uuid: string) {
    const story = await this.resolveStory(storyIdentifier);

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
