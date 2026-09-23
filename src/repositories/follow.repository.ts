import { AppDataSource } from "../database/data-source";
import { Follow } from "../entities/follow.entity";

export class FollowRepository {
  private repository = AppDataSource.getRepository(Follow);

  // Find a specific follow relation
  async findFollow(follower_id: string, following_id: string): Promise<Follow | null> {
    return this.repository.findOne({
      where: { follower_id, following_id },
    });
  }

  // Create a new follow relation
  async createFollow(follower_id: string, following_id: string): Promise<Follow> {
    const follow = this.repository.create({ follower_id, following_id });
    return this.repository.save(follow);
  }

  // Delete a follow relation
  async deleteFollow(follower_id: string, following_id: string): Promise<boolean> {
    const result = await this.repository.delete({ follower_id, following_id });
    return (result.affected ?? 0) > 0;
  }

  // Get list of followers for a user (users who follow following_id)
  async getFollowers(
    following_id: string,
    options: { skip: number; take: number }
  ): Promise<{ follows: Follow[]; total: number }> {
    const [follows, total] = await this.repository.findAndCount({
      where: { following_id },
      relations: ["follower"],
      order: { created_at: "DESC" },
      skip: options.skip,
      take: options.take,
    });

    return { follows, total };
  }

  // Get list of users a user is following (users whom follower_id follows)
  async getFollowing(
    follower_id: string,
    options: { skip: number; take: number }
  ): Promise<{ follows: Follow[]; total: number }> {
    const [follows, total] = await this.repository.findAndCount({
      where: { follower_id },
      relations: ["following"],
      order: { created_at: "DESC" },
      skip: options.skip,
      take: options.take,
    });

    return { follows, total };
  }

  // Count followers of a user
  async countFollowers(following_id: string): Promise<number> {
    return this.repository.count({ where: { following_id } });
  }

  // Count users followed by a user
  async countFollowing(follower_id: string): Promise<number> {
    return this.repository.count({ where: { follower_id } });
  }
}

export const followRepository = new FollowRepository();
