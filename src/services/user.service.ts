import { ROLES } from "../config/constants";
import { UpdateUserProfileDto } from "../dtos/user.dto";
import { userRepository } from "../repositories/user.repository";
import { followRepository } from "../repositories/follow.repository";
import ApiError from "../utils/api.error";
import { calculatePagination, IPaginatedResult } from "../utils/pagination";
import { AppDataSource } from "../database/data-source";
import { User } from "../entities/user.entity";

export class UserService {
  /** Return a public profile without the password hash. */
  async getPublicProfile(userUuid: string) {
    const user = await userRepository.findByUuid(userUuid);

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    const [followerCount, followingCount] = await Promise.all([
      followRepository.countFollowers(user.user_uuid),
      followRepository.countFollowing(user.user_uuid),
    ]);

    const { password, ...userWithoutPassword } = user;
    return { ...userWithoutPassword, followerCount, followingCount };
  }

  /** Update only the authenticated user's allowed profile fields. */
  async updateProfile(userUuid: string, data: UpdateUserProfileDto) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Only check for a username conflict when the username is actually
      // being changed. Guard against an undefined username (e.g. when only
      // bio/avatar is updated) and allow the user to keep their own username.
      if (data.username) {
        const existingUser = await userRepository.findByUsername(
          data.username,
          queryRunner.manager,
        );

        if (existingUser && existingUser.user_uuid !== userUuid) {
          throw ApiError.conflict(
            "Username already exists, Please use another username.",
          );
        }
      }

      const updatedUser = await userRepository.updateProfile(
        userUuid,
        data,
        queryRunner.manager,
      );

      if (!updatedUser) {
        throw ApiError.notFound("User not found");
      }

      const { password, ...userWithoutPassword } = updatedUser;

      await queryRunner.commitTransaction();
      return userWithoutPassword;
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /** Return non-admin users with safe pagination defaults and search. */
  async getAllUsers(
    pageInput: number,
    limitInput: number,
    search?: string,
  ): Promise<IPaginatedResult<Omit<User, "password">>> {
    const { page, limit } = calculatePagination(0, {
      page: pageInput,
      limit: limitInput,
    });

    const { users, total } = await userRepository.getAllUsers({
      page,
      limit,
      role: ROLES.USER,
      search,
    });

    return {
      data: users.map(
        ({ password, ...userWithoutPassword }) => userWithoutPassword,
      ),
      meta: calculatePagination(total, { page, limit }),
    };
  }
}

export const userService = new UserService();
