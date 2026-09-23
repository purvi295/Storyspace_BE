import { AppDataSource } from "../database/data-source";
import { CreateStoryDto, UpdateStoryDto, StoryQueryDto } from "../dtos/story.dto";
import { Story } from "../entities/story.entity";
import { STORY_STATUS, STORY_VISIBILITY } from "../config/constants";

export class StoryRepository {
  private repository = AppDataSource.getRepository(Story);

  async create(storyData: CreateStoryDto & { user_uuid: string }) {
    const story = this.repository.create(storyData);
    return await this.repository.save(story);
  }

  async findById(id: number) {
    return await this.repository.findOneBy({ id });
  }

  async findByUuid(uuid: string) {
    return await this.repository.findOneBy({ story_uuid: uuid });
  }

  async findBySlug(slug: string) {
    return await this.repository.findOneBy({ slug });
  }

  async update(story: Story, storyData: UpdateStoryDto) {
    return await this.repository.update(story, storyData);
  }

  async delete(story: Story) {
    return await this.repository.delete(story);
  }

  async findByTitle(title: string) {
    return this.repository.findOneBy({ title: title });
  }

  /**
   * Find all public published stories (for public reading)
   * Only returns stories with status = 'published' and visibility = 'public'
   */
  async findPublicPublishedStories(options: {
    skip: number;
    take: number;
  }): Promise<{ stories: Story[]; total: number }> {
    const queryBuilder = this.repository
      .createQueryBuilder("story")
      .where("story.status = :status", { status: STORY_STATUS.PUBLISHED })
      .andWhere("story.visibility = :visibility", {
        visibility: STORY_VISIBILITY.PUBLIC,
      })
      .orderBy("story.published_at", "DESC")
      .addOrderBy("story.created_at", "DESC");

    const total = await queryBuilder.getCount();
    const stories = await queryBuilder.skip(options.skip).take(options.take).getMany();

    return { stories, total };
  }

  /**
   * Find stories by a specific user (user-wise stories)
   */
  async findStoriesByUser(options: {
    user_uuid: string;
    skip: number;
    take: number;
    status?: string;
  }): Promise<{ stories: Story[]; total: number }> {
    const queryBuilder = this.repository
      .createQueryBuilder("story")
      .where("story.user_uuid = :user_uuid", { user_uuid: options.user_uuid })
      .orderBy("story.created_at", "DESC");

    if (options.status) {
      queryBuilder.andWhere("story.status = :status", {
        status: options.status,
      });
    }

    const total = await queryBuilder.getCount();
    const stories = await queryBuilder
      .skip(options.skip)
      .take(options.take)
      .getMany();

    return { stories, total };
  }

  /**
   * Find all stories with filters and pagination (for authenticated users)
   */
  async findAllWithFilters(options: {
    skip: number;
    take: number;
    status?: string;
    visibility?: string;
    author?: string;
  }): Promise<{ stories: Story[]; total: number }> {
    const queryBuilder = this.repository
      .createQueryBuilder("story")
      .orderBy("story.created_at", "DESC");

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

    const total = await queryBuilder.getCount();
    const stories = await queryBuilder
      .skip(options.skip)
      .take(options.take)
      .getMany();

    return { stories, total };
  }

  /**
   * Get story count by user
   */
  async getStoryCountByUser(user_uuid: string): Promise<number> {
    return await this.repository.count({ where: { user_uuid } });
  }
}

export const storyRepository = new StoryRepository();
