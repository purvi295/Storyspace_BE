import { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { Like } from "../entities/like.entity";
import { calculateSkip } from "../utils/pagination";

export class LikeRepository {
  private repository = AppDataSource.getRepository(Like);

  private getRepo(manager?: EntityManager): Repository<Like> {
    return manager ? manager.getRepository(Like) : this.repository;
  }

  // Find an active like (ignores soft-deleted rows)
  async findLike(
    story_uuid: string,
    user_id: string,
    manager?: EntityManager,
  ): Promise<Like | null> {
    return this.getRepo(manager).findOne({
      where: { story_uuid, user_id, is_delete: 0 },
    });
  }

  // Find any like regardless of is_delete (used to reactivate on re-like)
  async findLikeAny(
    story_uuid: string,
    user_id: string,
    manager?: EntityManager,
  ): Promise<Like | null> {
    return this.getRepo(manager).findOne({
      where: { story_uuid, user_id },
    });
  }

  // Create a new like
  async addLike(
    story_uuid: string,
    user_id: string,
    manager?: EntityManager,
  ): Promise<Like> {
    const repo = this.getRepo(manager);
    const like = repo.create({ story_uuid, user_id, is_delete: 0 });
    return repo.save(like);
  }

  // Soft delete: flag the like as deleted and stamp deleted_at
  async removeLike(
    story_uuid: string,
    user_id: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const result = await this.getRepo(manager).update(
      { story_uuid, user_id, is_delete: 0 },
      { is_delete: 1, deleted_at: new Date() },
    );
    return (result.affected ?? 0) > 0;
  }

  // Soft delete all likes for a story (cascade soft delete)
  async deleteByStoryUuid(story_uuid: string, manager?: EntityManager): Promise<void> {
    await this.getRepo(manager).update(
      { story_uuid, is_delete: 0 },
      { is_delete: 1, deleted_at: new Date() },
    );
  }

  // Re-like: reactivate a previously unliked like (no duplicate insert)
  async reactivateLike(id: number, manager?: EntityManager): Promise<void> {
    await this.getRepo(manager).update(
      { id },
      { is_delete: 0, deleted_at: null },
    );
  }

  // Count likes for a specific story (excluding soft-deleted)
  async countLikes(story_uuid: string, manager?: EntityManager): Promise<number> {
    return this.getRepo(manager).count({ where: { story_uuid, is_delete: 0 } });
  }

  // Get paginated list of users who liked a story (excluding soft-deleted)
  async getStoryLikes(
    story_uuid: string,
    options: { page: number; limit: number },
    manager?: EntityManager,
  ): Promise<{ likes: Like[]; total: number }> {
    const repo = this.getRepo(manager);
    const { page, limit } = options;
    const skip = calculateSkip(page, limit);
    const [likes, total] = await repo.findAndCount({
      where: { story_uuid, is_delete: 0 },
      relations: { user: true },
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    return { likes, total };
  }

  // Get paginated list of stories liked by a user (excluding soft-deleted)
  async getUserLikedStories(
    user_id: string,
    options: { page: number; limit: number },
    manager?: EntityManager,
  ): Promise<{ likes: Like[]; total: number }> {
    const repo = this.getRepo(manager);
    const { page, limit } = options;
    const skip = calculateSkip(page, limit);
    const [likes, total] = await repo.findAndCount({
      where: { user_id, is_delete: 0 },
      relations: { story: { creator: true } },
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    return { likes, total };
  }
}

export const likeRepository = new LikeRepository();
