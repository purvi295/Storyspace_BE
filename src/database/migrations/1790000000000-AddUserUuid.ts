import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserUuid1790000000000 implements MigrationInterface {
  name = 'AddUserUuid1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // gen_random_uuid() is provided by PostgreSQL's pgcrypto extension.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // The database supplies the UUID, including for rows that already exist.
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "user_uuid" UUID NOT NULL DEFAULT gen_random_uuid();
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_user_uuid"
      ON "users" ("user_uuid");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_user_uuid";`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "user_uuid";`);
  }
}
