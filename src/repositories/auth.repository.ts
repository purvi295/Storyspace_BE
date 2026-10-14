import { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { User } from "../entities/user.entity";

export class AuthRepository {
  private repository = AppDataSource.getRepository(User);

  private getRepo(manager?: EntityManager): Repository<User> {
    return manager ? manager.getRepository(User) : this.repository;
  }

  async findByEmail(
    email: string,
    manager?: EntityManager,
  ): Promise<User | null> {
    return this.getRepo(manager).findOne({ where: { email } });
  }

  async findByUsername(
    username: string,
    manager?: EntityManager,
  ): Promise<User | null> {
    return this.getRepo(manager).findOne({ where: { username } });
  }

  async findByUuid(
    user_uuid: string,
    manager?: EntityManager,
  ): Promise<User | null> {
    return this.getRepo(manager).findOne({ where: { user_uuid } });
  }

  async findByEmailOrUsername(
    email: string,
    username: string,
    manager?: EntityManager,
  ): Promise<User | null> {
    return this.getRepo(manager).findOne({
      where: [{ email }, { username }],
    });
  }

  async create(
    data: {
      email: string;
      password: string;
      username: string;
      full_name: string;
      role: string;
    },
    manager?: EntityManager,
  ): Promise<User> {
    const repo = this.getRepo(manager);
    const user = repo.create(data);
    return repo.save(user);
  }

  async save(user: User, manager?: EntityManager): Promise<User> {
    return this.getRepo(manager).save(user);
  }
}

export const authRepository = new AuthRepository();
