import { followRepository } from "../repositories/follow.repository";
import { userRepository } from "../repositories/user.repository";
import ApiError from "../utils/api.error";
import { calculatePagination, IPaginatedResult } from "../utils/pagination";
import { AppDataSource } from "../database/data-source";

export class FollowService {
  /**
   * Helper to resolve target user by UUID
   */
  private async resolveTargetUser(user_uuid: string) {
    const user = await userRepository.findByUuid(user_uuid);

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    return user;
  }

  /**
   * Follow a target user
   */
  async followUser(followerUuid: string, targetIdentifier: string) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const targetUser = await this.resolveTargetUser(targetIdentifier);

      if (followerUuid === targetUser.user_uuid) {
        throw ApiError.badRequest("You cannot follow yourself");
      }

      const existingFollow = await followRepository.findFollowAny(
        followerUuid,
        targetUser.user_uuid,
        queryRunner.manager,
      );

      if (existingFollow) {
        // Already an active follow -> nothing to do
        if (existingFollow.is_delete === 0) {
          await queryRunner.commitTransaction();
          return {
            alreadyFollowing: true,
            message: `You are already following @${targetUser.username}`,
            follower_details: {
              user_uuid: targetUser.user_uuid,
              username: targetUser.username,
              full_name: targetUser.full_name,
            },
          };
        }

        // Previously unfollowed -> reactivate the same row instead of inserting a duplicate
        await followRepository.reactivateFollow(
          existingFollow.id,
          queryRunner.manager,
        );
        await queryRunner.commitTransaction();
        return {
          alreadyFollowing: false,
          message: `You are now following @${targetUser.username}`,
          follower_details: {
            id: existingFollow.id,
            user_uuid: targetUser.user_uuid,
            username: targetUser.username,
            full_name: targetUser.full_name,
            avatar_url: targetUser.avatar_url,
            created_at: existingFollow.created_at,
          },
        };
      }

      const follow = await followRepository.createFollow(
        followerUuid,
        targetUser.user_uuid,
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();
      return {
        // alreadyFollowing: false,
        message: `You are now following @${targetUser.username}`,
        follower_details: {
          id: follow.id,
          user_uuid: targetUser.user_uuid,
          username: targetUser.username,
          full_name: targetUser.full_name,
          avatar_url: targetUser.avatar_url,
          created_at: follow.created_at,
        },
      };
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Unfollow a target user
   */
  async unfollowUser(followerUuid: string, targetIdentifier: string) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const targetUser = await this.resolveTargetUser(targetIdentifier);

      if (followerUuid === targetUser.user_uuid) {
        throw ApiError.badRequest("You cannot unfollow yourself");
      }

      const deleted = await followRepository.deleteFollow(
        followerUuid,
        targetUser.user_uuid,
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();

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
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get paginated followers of a user
   */
  async getFollowers(
    targetIdentifier: string,
    pageInput = 1,
    limitInput = 10,
  ): Promise<IPaginatedResult<{ followed_at: Date; [key: string]: any }>> {
    const targetUser = await this.resolveTargetUser(targetIdentifier);

    const { page, limit } = calculatePagination(0, {
      page: pageInput,
      limit: limitInput,
    });

    const { follows, total } = await followRepository.getFollowers(
      targetUser.user_uuid,
      { page, limit },
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

    return {
      data: followers,
      meta: calculatePagination(total, { page, limit }),
    };
  }

  /**
   * Get paginated users that this user is following
   */
  async getFollowing(
    targetIdentifier: string,
    pageInput = 1,
    limitInput = 10,
  ): Promise<IPaginatedResult<{ followed_at: Date; [key: string]: any }> & { user: { user_uuid: string; username: string; full_name: string } }> {
    const targetUser = await this.resolveTargetUser(targetIdentifier);

    const { page, limit } = calculatePagination(0, {
      page: pageInput,
      limit: limitInput,
    });

    const { follows, total } = await followRepository.getFollowing(
      targetUser.user_uuid,
      { page, limit },
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

    return {
      user: {
        user_uuid: targetUser.user_uuid,
        username: targetUser.username,
        full_name: targetUser.full_name,
      },
      data: following,
      meta: calculatePagination(total, { page, limit }),
    };
  }

  /**
   * Check if a user is following another user
   */
  async isFollowing(followerUuid: string, targetIdentifier: string) {
    const followedUser = await this.resolveTargetUser(targetIdentifier);

    if (followerUuid === followedUser.user_uuid) {
      return {
        current_user_uuid: followerUuid,
        followed_user_uuid: followedUser.user_uuid,
        isFollowing: false,
        isSelf: true,
      };
    }

    const follow = await followRepository.findFollow(
      followerUuid,
      followedUser.user_uuid,
    );

    return {
      current_user_uuid: followerUuid,
      followed_user_uuid: followedUser.user_uuid,
      isFollowing: !!follow,
      isSelf: false,
    };
  }
}

export const followService = new FollowService();
