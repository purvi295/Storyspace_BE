import { followRepository } from "../repositories/follow.repository";
import { userRepository } from "../repositories/user.repository";
import ApiError from "../utils/api.error";
import { PaginationMeta } from "../utils/api.response";

export class FollowService {
  /**
   * Helper to resolve target user by either user_uuid or username
   */
  private async resolveTargetUser(identifier: string) {
    // Check if identifier is a valid UUID pattern
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        identifier
      );

    let user = null;
    if (isUuid) {
      user = await userRepository.findByUuid(identifier);
    }
    if (!user) {
      user = await userRepository.findByUsername(identifier);
    }

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    return user;
  }

  /**
   * Follow a target user
   */
  async followUser(followerUuid: string, targetIdentifier: string) {
    const targetUser = await this.resolveTargetUser(targetIdentifier);

    if (followerUuid === targetUser.user_uuid) {
      throw ApiError.badRequest("You cannot follow yourself");
    }

    const existingFollow = await followRepository.findFollow(
      followerUuid,
      targetUser.user_uuid
    );

    if (existingFollow) {
      return {
        alreadyFollowing: true,
        message: `You are already following @${targetUser.username}`,
        target: {
          user_uuid: targetUser.user_uuid,
          username: targetUser.username,
          full_name: targetUser.full_name,
        },
      };
    }

    const follow = await followRepository.createFollow(
      followerUuid,
      targetUser.user_uuid
    );

    return {
      alreadyFollowing: false,
      message: `You are now following @${targetUser.username}`,
      follow: {
        id: follow.id,
        follower_id: follow.follower_id,
        following_id: follow.following_id,
        created_at: follow.created_at,
      },
      target: {
        user_uuid: targetUser.user_uuid,
        username: targetUser.username,
        full_name: targetUser.full_name,
        avatar_url: targetUser.avatar_url,
      },
    };
  }

  /**
   * Unfollow a target user
   */
  async unfollowUser(followerUuid: string, targetIdentifier: string) {
    const targetUser = await this.resolveTargetUser(targetIdentifier);

    if (followerUuid === targetUser.user_uuid) {
      throw ApiError.badRequest("You cannot unfollow yourself");
    }

    const deleted = await followRepository.deleteFollow(
      followerUuid,
      targetUser.user_uuid
    );

    if (!deleted) {
      return {
        message: `You were not following @${targetUser.username}`,
        unfollowed: false,
      };
    }

    return {
      message: `Successfully unfollowed @${targetUser.username}`,
      unfollowed: true,
    };
  }

  /**
   * Get paginated followers of a user
   */
  async getFollowers(targetIdentifier: string, pageInput = 1, limitInput = 10) {
    const targetUser = await this.resolveTargetUser(targetIdentifier);

    const page = Number.isInteger(pageInput) && pageInput > 0 ? pageInput : 1;
    const limit =
      Number.isInteger(limitInput) && limitInput > 0
        ? Math.min(limitInput, 100)
        : 10;
    const skip = (page - 1) * limit;

    const { follows, total } = await followRepository.getFollowers(
      targetUser.user_uuid,
      { skip, take: limit }
    );

    const followers = follows
      .filter((f) => f.follower)
      .map((f) => {
        const { password, ...safeUser } = f.follower;
        return {
          ...safeUser,
          followed_at: f.created_at,
        };
      });

    const totalPages = Math.ceil(total / limit) || 1;
    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      currentPageTotal: followers.length,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    };

    return {
      user: {
        user_uuid: targetUser.user_uuid,
        username: targetUser.username,
        full_name: targetUser.full_name,
      },
      followers,
      pagination,
    };
  }

  /**
   * Get paginated users that this user is following
   */
  async getFollowing(targetIdentifier: string, pageInput = 1, limitInput = 10) {
    const targetUser = await this.resolveTargetUser(targetIdentifier);

    const page = Number.isInteger(pageInput) && pageInput > 0 ? pageInput : 1;
    const limit =
      Number.isInteger(limitInput) && limitInput > 0
        ? Math.min(limitInput, 100)
        : 10;
    const skip = (page - 1) * limit;

    const { follows, total } = await followRepository.getFollowing(
      targetUser.user_uuid,
      { skip, take: limit }
    );

    const following = follows
      .filter((f) => f.following)
      .map((f) => {
        const { password, ...safeUser } = f.following;
        return {
          ...safeUser,
          followed_at: f.created_at,
        };
      });

    const totalPages = Math.ceil(total / limit) || 1;
    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      currentPageTotal: following.length,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    };

    return {
      user: {
        user_uuid: targetUser.user_uuid,
        username: targetUser.username,
        full_name: targetUser.full_name,
      },
      following,
      pagination,
    };
  }

  /**
   * Check if a user is following another user
   */
  async isFollowing(followerUuid: string, targetIdentifier: string) {
    const targetUser = await this.resolveTargetUser(targetIdentifier);
    const follow = await followRepository.findFollow(
      followerUuid,
      targetUser.user_uuid
    );

    return {
      follower_uuid: followerUuid,
      target_uuid: targetUser.user_uuid,
      target_username: targetUser.username,
      isFollowing: !!follow,
    };
  }
}

export const followService = new FollowService();
