import { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { Comment } from "../entities/comment.entity";
import { calculateSkip } from "../utils/pagination";

export class CommentRepository {
  private repository = AppDataSource.getRepository(Comment);

  private getRepo(manager?: EntityManager): Repository<Comment> {
    return manager ? manager.getRepository(Comment) : this.repository;
  }

  // Create a new comment
  async createComment(
    data: {
      story_uuid: string;
      user_id: string;
      content: string;
    },
    manager?: EntityManager,
  ): Promise<Comment> {
    const repo = this.getRepo(manager);
    const comment = repo.create({ ...data, is_delete: 0 });
    const saved = await repo.save(comment);
    return this.findById(saved.id, manager) as Promise<Comment>;
  }

  // Find comment by primary key ID with relations (excluding soft-deleted)
  async findById(id: number, manager?: EntityManager): Promise<Comment | null> {
    return this.getRepo(manager).findOne({
      where: { id, is_delete: 0 },
      relations: { user: true, story: true },
    });
  }

  // Find comment by UUID with relations (excluding soft-deleted)
  async findByUuid(
    comment_uuid: string,
    manager?: EntityManager,
  ): Promise<Comment | null> {
    return this.getRepo(manager).findOne({
      where: { comment_uuid, is_delete: 0 },
      relations: { user: true, story: true },
    });
  }

  // Find paginated comments for a specific story (excluding soft-deleted)
  async findByStoryUuid(
    story_uuid: string,
    options: { page: number; limit: number },
    manager?: EntityManager,
  ): Promise<{ comments: Comment[]; total: number }> {
    const repo = this.getRepo(manager);
    const { page, limit } = options;
    const skip = calculateSkip(page, limit);
    const [comments, total] = await repo.findAndCount({
      where: { story_uuid, is_delete: 0 },
      relations: { user: true },
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    return { comments, total };
  }

  // Update a comment by UUID
  async updateComment(
    comment_uuid: string,
    content: string,
    manager?: EntityManager,
  ): Promise<Comment | null> {
    await this.getRepo(manager).update(
      { comment_uuid, is_delete: 0 },
      { content },
    );
    return this.findByUuid(comment_uuid, manager);
  }

  // Soft delete a comment by UUID
  async deleteComment(
    comment_uuid: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const result = await this.getRepo(manager).update(
      { comment_uuid, is_delete: 0 },
      { is_delete: 1, deleted_at: new Date() },
    );
    return (result.affected ?? 0) > 0;
  }

  // Soft delete all comments for a story (cascade soft delete)
  async deleteByStoryUuid(
    story_uuid: string,
    manager?: EntityManager,
  ): Promise<void> {
    await this.getRepo(manager).update(
      { story_uuid, is_delete: 0 },
      { is_delete: 1, deleted_at: new Date() },
    );
  }

  // Count comments for a story (excluding soft-deleted)
  async countComments(
    story_uuid: string,
    manager?: EntityManager,
  ): Promise<number> {
    return this.getRepo(manager).count({ where: { story_uuid, is_delete: 0 } });
  }
}

export const commentRepository = new CommentRepository();
