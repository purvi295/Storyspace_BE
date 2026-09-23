import { AppDataSource } from "../database/data-source";
import { Comment } from "../entities/comment.entity";

export class CommentRepository {
  private repository = AppDataSource.getRepository(Comment);

  // Create a new comment
  async createComment(data: {
    story_uuid: string;
    user_id: string;
    content: string;
  }): Promise<Comment> {
    const comment = this.repository.create(data);
    const saved = await this.repository.save(comment);
    return this.findById(saved.id) as Promise<Comment>;
  }

  // Find comment by primary key ID with relations
  async findById(id: number): Promise<Comment | null> {
    return this.repository.findOne({
      where: { id },
      relations: ["user", "story"],
    });
  }

  // Find paginated comments for a specific story
  async findByStoryUuid(
    story_uuid: string,
    options: { skip: number; take: number }
  ): Promise<{ comments: Comment[]; total: number }> {
    const [comments, total] = await this.repository.findAndCount({
      where: { story_uuid },
      relations: ["user"],
      order: { created_at: "DESC" },
      skip: options.skip,
      take: options.take,
    });

    return { comments, total };
  }

  // Update a comment
  async updateComment(id: number, content: string): Promise<Comment | null> {
    await this.repository.update({ id }, { content });
    return this.findById(id);
  }

  // Delete a comment
  async deleteComment(id: number): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return (result.affected ?? 0) > 0;
  }

  // Count comments for a story
  async countComments(story_uuid: string): Promise<number> {
    return this.repository.count({ where: { story_uuid } });
  }
}

export const commentRepository = new CommentRepository();
