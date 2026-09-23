import { AppDataSource } from "../database/data-source";
import { Like } from "../entities/like.entity";

export class LikeRepository {
  private repository = AppDataSource.getRepository(Like);

  // Find a specific like by story UUID and user UUID
  async findLike(story_uuid: string, user_id: string): Promise<Like | null> {
    return this.repository.findOne({
      where: { story_uuid, user_id },
    });
  }

  // Create a new like
  async addLike(story_uuid: string, user_id: string): Promise<Like> {
    const like = this.repository.create({ story_uuid, user_id });
    return this.repository.save(like);
  }

  // Remove a like
  async removeLike(story_uuid: string, user_id: string): Promise<boolean> {
    const result = await this.repository.delete({ story_uuid, user_id });
    return (result.affected ?? 0) > 0;
  }

  // Count likes for a specific story
  async countLikes(story_uuid: string): Promise<number> {
    return this.repository.count({ where: { story_uuid } });
  }

  // Get paginated list of users who liked a story
  async getStoryLikes(
    story_uuid: string,
    options: { skip: number; take: number }
  ): Promise<{ likes: Like[]; total: number }> {
    const [likes, total] = await this.repository.findAndCount({
      where: { story_uuid },
      relations: ["user"],
      order: { created_at: "DESC" },
      skip: options.skip,
      take: options.take,
    });

    return { likes, total };
  }

  // Get paginated list of stories liked by a user
  async getUserLikedStories(
    user_id: string,
    options: { skip: number; take: number }
  ): Promise<{ likes: Like[]; total: number }> {
    const [likes, total] = await this.repository.findAndCount({
      where: { user_id },
      relations: ["story", "story.author"],
      order: { created_at: "DESC" },
      skip: options.skip,
      take: options.take,
    });

    return { likes, total };
  }
}

export const likeRepository = new LikeRepository();
