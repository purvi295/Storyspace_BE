import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1789974971316 implements MigrationInterface {
  name = 'CreateUsersTable1789974971316';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "username" VARCHAR(100) NOT NULL UNIQUE,
        "full_name" VARCHAR(150) NOT NULL,
        "bio" TEXT,
        "avatar_url" VARCHAR(500),
        "role" VARCHAR(20) NOT NULL DEFAULT 'user' CHECK ("role" IN ('admin', 'author', 'user')),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_users_username" ON "users" ("username");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" ("role");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE;`);
  }
}
