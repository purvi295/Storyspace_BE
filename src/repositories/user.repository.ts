import { AppDataSource } from "../database/data-source";
import { User } from "../entities/user.entity";

export class UserRepository {
 
  private repository = AppDataSource.getRepository(User);

  // Find user by UUID primary key
  async findByUuid(user_uuid: string): Promise<User | null> {
    return this.repository.findOne({ where: { user_uuid } });
  }

  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  // Find user by username
  async findByUsername(username: string): Promise<User | null> {
    return this.repository.findOne({ where: { username } });
  }

  // Find user by username with follower/following counts
  async findByUsernameWithCounts(username: string): Promise<User | null> {
    const user = await this.repository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.followers", "followers")
      .leftJoinAndSelect("user.following", "following")
      .where("user.username = :username", { username })
      .getOne();

    return user;
  }

  // Get follower count
  async getFollowerCount(userUuid: string): Promise<number> {
    return this.repository
      .createQueryBuilder("user")
      .leftJoin("user.followers", "followers")
      .where("user.user_uuid = :userUuid", { userUuid })
      .getCount();
  }

  // Get following count
  async getFollowingCount(userUuid: string): Promise<number> {
    return this.repository
      .createQueryBuilder("user")
      .leftJoin("user.following", "following")
      .where("user.user_uuid = :userUuid", { userUuid })
      .getCount();
  }

  // Update user profile
  async updateProfile(
    userUuid: string,
    data: {
      bio?: string;
      avatar_url?: string;
      full_name?: string;
    },
  ): Promise<User | null> {
    await this.repository.update({ user_uuid: userUuid }, data);
    return this.findByUuid(userUuid);
  }

  //get all user list excluding the admin users
  async getAllUsers(options: { skip: number; take: number; role: string }) {
    const { skip, take, role } = options;
    const users = await this.repository.find({
      skip,
      take,
      where: { role },
    });
    const total = await this.repository.count({ where: { role } });
    return { users, total };
  }
}

export const userRepository = new UserRepository();
