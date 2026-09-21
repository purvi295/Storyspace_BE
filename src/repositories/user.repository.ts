import { AppDataSource } from '../database/data-source';
import { User } from '../entities/user.entity';

export class UserRepository {
  private repository = AppDataSource.getRepository(User);

  // Find user by ID
  async findById(id: number): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
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
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.followers', 'followers')
      .leftJoinAndSelect('user.following', 'following')
      .where('user.username = :username', { username })
      .getOne();

    return user;
  }

  // Get follower count
  async getFollowerCount(userId: number): Promise<number> {
    return this.repository
      .createQueryBuilder('user')
      .leftJoin('user.followers', 'followers')
      .where('user.id = :userId', { userId })
      .getCount();
  }

  // Get following count
  async getFollowingCount(userId: number): Promise<number> {
    return this.repository
      .createQueryBuilder('user')
      .leftJoin('user.following', 'following')
      .where('user.id = :userId', { userId })
      .getCount();
  }

  // Update user profile
  async updateProfile(userId: number, data: {
    bio?: string;
    avatar_url?: string;
    full_name?: string;
  }): Promise<User | null> {
    await this.repository.update(userId, data);
    return this.findById(userId);
  }
}

export const userRepository = new UserRepository();
