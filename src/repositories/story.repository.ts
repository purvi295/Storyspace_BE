import {
  Brackets,
  EntityManager,
  Repository,
  SelectQueryBuilder,
} from "typeorm";
import { AppDataSource } from "../database/data-source";
import {
  CreateStoryDto,
  UpdateStoryDto,
  StoryQueryDto,
} from "../dtos/story.dto";
import { Story } from "../entities/story.entity";
import { Follow } from "../entities/follow.entity";
import { STORY_STATUS, STORY_VISIBILITY } from "../config/constants";
import { calculateSkip } from "../utils/pagination";

export class StoryRepository {
  private repository = AppDataSource.getRepository(Story);

  private getRepo(manager?: EntityManager): Repository<Story> {
    return manager ? manager.getRepository(Story) : this.repository;
  }

  async create(
    storyData: CreateStoryDto & { user_uuid: string },
    manager?: EntityManager,
  ) {
    const repo = this.getRepo(manager);
    const story = repo.create({ ...storyData, is_delete: 0 });
    return await repo.save(story);
  }

  async findById(id: number, manager?: EntityManager) {
    return this.getRepo(manager).findOneBy({ id, is_delete: 0 });
  }

  async findByUuid(uuid: string, manager?: EntityManager) {
    return this.getRepo(manager).findOneBy({ story_uuid: uuid, is_delete: 0 });
  }

  async findBySlug(slug: string, manager?: EntityManager) {
    return this.getRepo(manager).findOneBy({ slug, is_delete: 0 });
  }

  async update(
    story: Story,
    storyData: UpdateStoryDto,
    manager?: EntityManager,
  ) {
    return this.getRepo(manager).update(
      { story_uuid: story.story_uuid, is_delete: 0 },
      storyData,
    );
  }

  async delete(story: Story, manager?: EntityManager) {
    return this.getRepo(manager).update(
      { story_uuid: story.story_uuid, is_delete: 0 },
      { is_delete: 1, deleted_at: new Date() },
    );
  }

  async findByTitle(title: string, manager?: EntityManager) {
    return this.getRepo(manager).findOneBy({ title: title, is_delete: 0 });
  }

  /**
   * Find all public published stories (for public reading)
   * Only returns stories with status = 'published' and visibility = 'public'
   */
  async findPublicPublishedStories(options: {
    page: number;
    limit: number;
    searchQuery?: string;
  }): Promise<{ stories: Story[]; total: number }> {
    const { page, limit } = options;

    const queryBuilder = this.repository
      .createQueryBuilder("story")
      .where("story.status = :status", { status: STORY_STATUS.PUBLISHED })
      .andWhere("story.visibility = :visibility", {
        visibility: STORY_VISIBILITY.PUBLIC,
      })
      .andWhere("story.is_delete = :is_delete", { is_delete: 0 })
      .orderBy("story.published_at", "DESC")
      .addOrderBy("story.created_at", "DESC");

    if (options.searchQuery) {
      const words = options.searchQuery.toLowerCase().split(/\s+/);
      if (words.length > 0) {
        queryBuilder.andWhere(
          new Brackets((qb) => {
            words.forEach((word, index) => {
              const paramName = `keyword_${index}`;
              const paramValue = `%${word}%`;
              if (index === 0) {
                qb.where(
                  `(LOWER(story.title) LIKE :${paramName} OR LOWER(story.content) LIKE :${paramName} OR LOWER(story.summary) LIKE :${paramName})`,
                  { [paramName]: paramValue },
                );
              } else {
                qb.andWhere(
                  `(LOWER(story.title) LIKE :${paramName} OR LOWER(story.content) LIKE :${paramName} OR LOWER(story.summary) LIKE :${paramName})`,
                  { [paramName]: paramValue },
                );
              }
            });
          }),
        );
      }
    }

    const [stories, total] = await queryBuilder
      .skip(calculateSkip(page, limit))
      .take(limit)
      .getManyAndCount();

    return { stories, total };
  }

  /**
   * Find stories by a specific user (user-wise stories)
   */
  async findStoriesByUser(options: {
    user_uuid: string;
    page: number;
    limit: number;
    status?: string;
    allowedVisibilities?: string[];
  }): Promise<{ stories: Story[]; total: number }> {
    const { page, limit } = options;

    const queryBuilder = this.repository
      .createQueryBuilder("story")
      .where("story.user_uuid = :user_uuid", { user_uuid: options.user_uuid })
      .andWhere("story.is_delete = :is_delete", { is_delete: 0 })
      .orderBy("story.created_at", "DESC");

    if (options.status) {
      queryBuilder.andWhere("story.status = :status", {
        status: options.status,
      });
    }

    if (options.allowedVisibilities?.length) {
      queryBuilder.andWhere("story.visibility IN (:...allowedVisibilities)", {
        allowedVisibilities: options.allowedVisibilities,
      });
    }

    const [stories, total] = await queryBuilder
      .skip(calculateSkip(page, limit))
      .take(limit)
      .getManyAndCount();

    return { stories, total };
  }

  /**
   * Find all stories with filters and pagination (for authenticated users)
   * Enforces that followers_only stories are only visible to the author or followers of the author.
   */
  async findAllWithFilters(options: {
    page: number;
    limit: number;
    status?: string;
    visibility?: string;
    author?: string;
    currentUserUuid?: string;
    searchQuery?: string;
    isAdmin?: boolean;
  }): Promise<{ stories: Story[]; total: number }> {
    const { page, limit } = options;

    const queryBuilder = this.repository
      .createQueryBuilder("story")
      .where("story.is_delete = :is_delete", { is_delete: 0 })
      .orderBy("story.created_at", "DESC");

    if (!options.isAdmin) {
      if (options.currentUserUuid) {
        queryBuilder.andWhere(
          new Brackets((qb) => {
            qb.where("story.user_uuid = :currentUserUuid", {
              currentUserUuid: options.currentUserUuid,
            }).orWhere(
              new Brackets((qbPublished) => {
                qbPublished
                  .where("story.status = :publishedStatus", {
                    publishedStatus: STORY_STATUS.PUBLISHED,
                  })
                  .andWhere(
                    new Brackets((qbVis) => {
                      qbVis
                        .where("story.visibility = :publicVisibility", {
                          publicVisibility: STORY_VISIBILITY.PUBLIC,
                        })
                        .orWhere(
                          (subQb: SelectQueryBuilder<any>) => {
                            const subQuery = subQb
                              .subQuery()
                              .select("1")
                              .from(Follow, "f")
                              .where("f.follower_id = :currentUserUuid")
                              .andWhere("f.following_id = story.user_uuid")
                              .andWhere("f.is_delete = 0")
                              .getQuery();
                            return `story.visibility = :followersOnlyVisibility AND EXISTS (${subQuery})`;
                          },
                          {
                            followersOnlyVisibility:
                              STORY_VISIBILITY.FOLLOWERS_ONLY,
                            currentUserUuid: options.currentUserUuid,
                          },
                        );
                    }),
                  );
              }),
            );
          }),
        );
      } else {
        queryBuilder
          .andWhere("story.status = :publishedStatus", {
            publishedStatus: STORY_STATUS.PUBLISHED,
          })
          .andWhere("story.visibility = :publicVisibility", {
            publicVisibility: STORY_VISIBILITY.PUBLIC,
          });
      }
    }

    if (options.status) {
      queryBuilder.andWhere("story.status = :status", {
        status: options.status,
      });
    }

    if (options.visibility) {
      queryBuilder.andWhere("story.visibility = :visibility", {
        visibility: options.visibility,
      });
    }

    if (options.author) {
      queryBuilder.andWhere("story.user_uuid = :author", {
        author: options.author,
      });
    }

    if (options.searchQuery) {
      const words = options.searchQuery.toLowerCase().split(/\s+/);
      if (words.length > 0) {
        queryBuilder.andWhere(
          new Brackets((qb) => {
            words.forEach((word, index) => {
              const paramName = `keyword_${index}`;
              const paramValue = `%${word}%`;
              if (index === 0) {
                qb.where(
                  `(LOWER(story.title) LIKE :${paramName} OR LOWER(story.content) LIKE :${paramName} OR LOWER(story.summary) LIKE :${paramName})`,
                  { [paramName]: paramValue },
                );
              } else {
                qb.andWhere(
                  `(LOWER(story.title) LIKE :${paramName} OR LOWER(story.content) LIKE :${paramName} OR LOWER(story.summary) LIKE :${paramName})`,
                  { [paramName]: paramValue },
                );
              }
            });
          }),
        );
      }
    }

    const [stories, total] = await queryBuilder
      .skip(calculateSkip(page, limit))
      .take(limit)
      .getManyAndCount();

    return { stories, total };
  }

  /**
   * Get story count by user (excluding soft-deleted)
   */
  async getStoryCountByUser(
    user_uuid: string,
    manager?: EntityManager,
  ): Promise<number> {
    return await this.getRepo(manager).count({
      where: { user_uuid, is_delete: 0 },
    });
  }

  /**
   * Get story count by user and optional status (excluding soft-deleted)
   */
  async getStoryCountByUserAndStatus(
    user_uuid: string,
    status?: string,
    manager?: EntityManager,
  ): Promise<number> {
    const where: { user_uuid: string; is_delete: number; status?: string } = {
      user_uuid,
      is_delete: 0,
    };
    if (status) {
      where.status = status;
    }
    return await this.getRepo(manager).count({ where });
  }
}

export const storyRepository = new StoryRepository();
