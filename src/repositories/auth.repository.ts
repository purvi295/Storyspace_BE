import { AppDataSource } from "../database/data-source";
import { User } from "../entities/user.entity";

export class AuthRepository {
  private repository = AppDataSource.getRepository(User);

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.repository.findOne({ where: { username } });
  }

  async findByUuid(user_uuid: string): Promise<User | null> {
    return this.repository.findOne({ where: { user_uuid } });
  }

  async findByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<User | null> {
    return this.repository.findOne({
      where: [{ email }, { username }],
    });
  }

  async create(data: {
    email: string;
    password: string;
    username: string;
    full_name: string;
    role: string;
  }): Promise<User> {
    const user = this.repository.create(data);
    return this.repository.save(user);
  }

  async save(user: User): Promise<User> {
    return this.repository.save(user);
  }
}

export const authRepository = new AuthRepository();
