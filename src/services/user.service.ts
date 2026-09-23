import { ROLES } from "../config/constants";
import { UpdateUserProfileDto } from "../dtos/user.dto";
import { userRepository } from "../repositories/user.repository";

export class UserService {
  /** Return a public profile without the password hash. */
  async getPublicProfile(username: string) {
    const user = await userRepository.findByUsername(username);

    if (!user) {
      throw new Error("User not found");
    }

    const [followerCount, followingCount] = await Promise.all([
      userRepository.getFollowerCount(user.user_uuid),
      userRepository.getFollowingCount(user.user_uuid),
    ]);

    const { password, ...userWithoutPassword } = user;
    return { ...userWithoutPassword, followerCount, followingCount };
  }

  /** Update only the authenticated user's allowed profile fields. */
  async updateProfile(userUuid: string, data: UpdateUserProfileDto) {
    const updatedUser = await userRepository.updateProfile(userUuid, data);

    if (!updatedUser) {
      throw new Error("User not found");
    }

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /** Return non-admin users with safe pagination defaults. */
  async getAllUsers(pageInput: number, limitInput: number) {
    const page = Number.isInteger(pageInput) && pageInput > 0 ? pageInput : 1;
    const limit =
      Number.isInteger(limitInput) && limitInput > 0
        ? Math.min(limitInput, 100)
        : 10;
    const skip = (page - 1) * limit;

    const { users, total } = await userRepository.getAllUsers({
      skip,
      take: limit,
      role: ROLES.USER,
    });

    return {
      users: users.map(
        ({ password, ...userWithoutPassword }) => userWithoutPassword,
      ),
      pagination: {
        currentPageTotal: users.length,
        page,
        nextPage: page < Math.ceil(total / limit) ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const userService = new UserService();
