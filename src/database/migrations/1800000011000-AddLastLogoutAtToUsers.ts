import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastLogoutAtToUsers1800000011000 implements MigrationInterface {
  name = 'AddLastLogoutAtToUsers1800000011000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "last_logout_at" TIMESTAMP WITH TIME ZONE NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "last_logout_at";
    `);
  }
}
