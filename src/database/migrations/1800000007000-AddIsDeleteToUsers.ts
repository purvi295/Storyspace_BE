import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsDeleteToUsers1800000007000 implements MigrationInterface {
  name = 'AddIsDeleteToUsers1800000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add is_delete column with default 0
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "is_delete" INT DEFAULT 0;
    `);

    // Create index on is_delete for faster filtering
    await queryRunner.query(`
      CREATE INDEX "idx_users_is_delete" ON "users" ("is_delete");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_is_delete";`);

    // Drop column
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "is_delete";`);
  }
}
