import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoftDeleteToLikes1800000006000 implements MigrationInterface {
  name = 'AddSoftDeleteToLikes1800000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add is_delete column with default 0
    await queryRunner.query(`
      ALTER TABLE "likes"
      ADD COLUMN "is_delete" INT DEFAULT 0;
    `);

    // Add deleted_at column (nullable)
    await queryRunner.query(`
      ALTER TABLE "likes"
      ADD COLUMN "deleted_at" TIMESTAMP WITH TIME ZONE;
    `);

    // Create index on is_delete for faster filtering
    await queryRunner.query(`
      CREATE INDEX "idx_likes_is_delete" ON "likes" ("is_delete");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_likes_is_delete";`);

    // Drop columns
    await queryRunner.query(`ALTER TABLE "likes" DROP COLUMN IF EXISTS "deleted_at";`);
    await queryRunner.query(`ALTER TABLE "likes" DROP COLUMN IF EXISTS "is_delete";`);
  }
}
