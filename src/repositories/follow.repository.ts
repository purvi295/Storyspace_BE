import { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { Follow } from "../entities/follow.entity";
import { calculateSkip } from "../utils/pagination";

export class FollowRepository {
  private repository = AppDataSource.getRepository(Follow);

  private getRepo(manager?: EntityManager): Repository<Follow> {
    return manager ? manager.getRepository(Follow) : this.repository;
  }

  // Find an active follow relation (ignores unfollowed/soft-deleted rows)
  async findFollow(
    follower_id: string,
    following_id: string,
    manager?: EntityManager,
  ): Promise<Follow | null> {
    return this.getRepo(manager).findOne({
      where: { follower_id, following_id, is_delete: 0 },
    });
  }

  // Find any follow relation regardless of is_delete (used to reactivate on re-follow)
  async findFollowAny(
    follower_id: string,
    following_id: string,
    manager?: EntityManager,
  ): Promise<Follow | null> {
    return this.getRepo(manager).findOne({
      where: { follower_id, following_id },
    });
  }

  // Create a new follow relation
  async createFollow(
    follower_id: string,
    following_id: string,
    manager?: EntityManager,
  ): Promise<Follow> {
    const repo = this.getRepo(manager);
    const follow = repo.create({ follower_id, following_id, is_delete: 0 });
    return repo.save(follow);
  }

  // Unfollow: flag the relation as deleted and stamp deleted_at
  async deleteFollow(
    follower_id: string,
    following_id: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const result = await this.getRepo(manager).update(
      { follower_id, following_id, is_delete: 0 },
      { is_delete: 1, deleted_at: new Date() },
    );
    return (result.affected ?? 0) > 0;
  }

  // Re-follow: reactivate a previously unfollowed relation (no duplicate insert)
  async reactivateFollow(id: number, manager?: EntityManager): Promise<void> {
    await this.getRepo(manager).update(
      { id },
      { is_delete: 0, deleted_at: null },
    );
  }

  // Get list of followers for a user (users who follow following_id)
  async getFollowers(
    following_id: string,
    options: { page: number; limit: number },
    manager?: EntityManager,
  ): Promise<{ follows: Follow[]; total: number }> {
    const repo = this.getRepo(manager);
    const { page, limit } = options;
    const skip = calculateSkip(page, limit);
    const [follows, total] = await repo.findAndCount({
      where: { following_id, is_delete: 0 },
      relations: { follower: true },
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    return { follows, total };
  }

  // Get list of users a user is following (users whom follower_id follows)
  async getFollowing(
    follower_id: string,
    options: { page: number; limit: number },
    manager?: EntityManager,
  ): Promise<{ follows: Follow[]; total: number }> {
    const repo = this.getRepo(manager);
    const { page, limit } = options;
    const skip = calculateSkip(page, limit);
    const [follows, total] = await repo.findAndCount({
      where: { follower_id, is_delete: 0 },
      relations: { following: true },
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    return { follows, total };
  }

  // Count followers of a user
  async countFollowers(
    following_id: string,
    manager?: EntityManager,
  ): Promise<number> {
    return this.getRepo(manager).count({ where: { following_id, is_delete: 0 } });
  }

  // Count users followed by a user
  async countFollowing(
    follower_id: string,
    manager?: EntityManager,
  ): Promise<number> {
    return this.getRepo(manager).count({ where: { follower_id, is_delete: 0 } });
  }
}

export const followRepository = new FollowRepository();
