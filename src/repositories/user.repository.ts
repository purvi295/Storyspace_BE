import { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { User } from "../entities/user.entity";
import { calculateSkip } from "../utils/pagination";

export class UserRepository {
 
  private repository = AppDataSource.getRepository(User);

  private getRepo(manager?: EntityManager): Repository<User> {
    return manager ? manager.getRepository(User) : this.repository;
  }

  // Find user by UUID primary key (excluding soft-deleted)
  async findByUuid(user_uuid: string, manager?: EntityManager): Promise<User | null> {
    return this.getRepo(manager).findOne({ where: { user_uuid, is_delete: 0 } });
  }

  // Find any user by UUID regardless of is_delete (used for reactivation)
  async findByUuidAny(user_uuid: string, manager?: EntityManager): Promise<User | null> {
    return this.getRepo(manager).findOne({ where: { user_uuid } });
  }

  // Find user by email (excluding soft-deleted)
  async findByEmail(email: string, manager?: EntityManager): Promise<User | null> {
    return this.getRepo(manager).findOne({ where: { email, is_delete: 0 } });
  }

  // Find user by username (excluding soft-deleted)
  async findByUsername(username: string, manager?: EntityManager): Promise<User | null> {
    return this.getRepo(manager).findOne({ where: { username, is_delete: 0 } });
  }

  // Find user by username with follower/following counts (excluding soft-deleted)
  async findByUsernameWithCounts(username: string, manager?: EntityManager): Promise<User | null> {
    const repo = this.getRepo(manager);
    const user = await repo
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.followers", "followers")
      .leftJoinAndSelect("user.following", "following")
      .where("user.username = :username", { username })
      .andWhere("user.is_delete = :is_delete", { is_delete: 0 })
      .getOne();

    return user;
  }

  // Get follower count
  async getFollowerCount(userUuid: string, manager?: EntityManager): Promise<number> {
    const repo = this.getRepo(manager);
    return repo
      .createQueryBuilder("user")
      .leftJoin("user.followers", "followers")
      .where("user.user_uuid = :userUuid", { userUuid })
      .getCount();
  }

  // Get following count
  async getFollowingCount(userUuid: string, manager?: EntityManager): Promise<number> {
    const repo = this.getRepo(manager);
    return repo
      .createQueryBuilder("user")
      .leftJoin("user.following", "following")
      .where("user.user_uuid = :userUuid", { userUuid })
      .getCount();
  }

  // Update user profile (excluding soft-deleted)
  async updateProfile(
    userUuid: string,
    data: {
      username?: string;
      full_name?: string;
      bio?: string;
      avatar_url?: string;
    },
    manager?: EntityManager,
  ): Promise<User | null> {
    await this.getRepo(manager).update({ user_uuid: userUuid, is_delete: 0 }, data);
    return this.findByUuid(userUuid, manager);
  }

  //get all user list excluding the admin users with search (excluding soft-deleted)
  async getAllUsers(
    options: { page: number; limit: number; role: string; search?: string },
    manager?: EntityManager,
  ) {
    const { page, limit, role, search } = options;
    const repo = this.getRepo(manager);
    const skip = calculateSkip(page, limit);

    const queryBuilder = repo
      .createQueryBuilder("user")
      .select([
        "user.id",
        "user.user_uuid",
        "user.email",
        "user.username",
        "user.full_name",
        "user.role",
        "user.avatar_url",
        "user.created_at",
        "user.updated_at",
      ])
      .orderBy("user.created_at", "DESC");

    queryBuilder.where("user.role = :role", { role });
    queryBuilder.andWhere("user.is_delete = :is_delete", { is_delete: 0 });

    if (search && search.trim().length > 0) {
      queryBuilder.andWhere(
        "LOWER(user.username) LIKE :search OR LOWER(user.email) LIKE :search OR LOWER(user.full_name) LIKE :search",
        { search: `%${search.trim().toLowerCase()}%` },
      );
    }

    const total = await queryBuilder.getCount();
    const users = await queryBuilder.skip(skip).take(limit).getMany();

    return { users, total };
  }

  // Get all users with pagination and search (for admin panel, excluding soft-deleted)
  async getAllUsersWithSearch(
    options: { page: number; limit: number; search?: string },
    manager?: EntityManager,
  ) {
    const { page, limit, search } = options;
    const skip = calculateSkip(page, limit);
    const repo = this.getRepo(manager);

    const queryBuilder = repo
      .createQueryBuilder("user")
      .select([
        "user.id",
        "user.user_uuid",
        "user.email",
        "user.username",
        "user.full_name",
        "user.role",
        "user.avatar_url",
        "user.created_at",
        "user.updated_at",
      ])
      .orderBy("user.created_at", "DESC");

    queryBuilder.where("user.is_delete = :is_delete", { is_delete: 0 });

    if (search && search.trim().length > 0) {
      queryBuilder.andWhere(
        "LOWER(user.username) LIKE :search OR LOWER(user.email) LIKE :search OR LOWER(user.full_name) LIKE :search",
        { search: `%${search.trim().toLowerCase()}%` },
      );
    }

    const [users, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return { users, total };
  }

  // Soft delete a user
  async softDelete(userUuid: string, manager?: EntityManager): Promise<boolean> {
    const result = await this.getRepo(manager).update(
      { user_uuid: userUuid, is_delete: 0 },
      { is_delete: 1, deleted_at: new Date() },
    );
    return (result.affected ?? 0) > 0;
  }

  // Reactivate a soft-deleted user
  async reactivate(userUuid: string, manager?: EntityManager): Promise<void> {
    await this.getRepo(manager).update(
      { user_uuid: userUuid },
      { is_delete: 0, deleted_at: null },
    );
  }
}

export const userRepository = new UserRepository();
