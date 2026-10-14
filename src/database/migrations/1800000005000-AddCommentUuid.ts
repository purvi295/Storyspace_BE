import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommentUuid1800000005000 implements MigrationInterface {
  name = 'AddCommentUuid1800000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add comment_uuid column as nullable first
    await queryRunner.query(`
      ALTER TABLE "comments"
      ADD COLUMN "comment_uuid" UUID DEFAULT gen_random_uuid();
    `);

    // Generate UUIDs for any existing records that might have NULL
    await queryRunner.query(`
      UPDATE "comments"
      SET "comment_uuid" = gen_random_uuid()
      WHERE "comment_uuid" IS NULL;
    `);

    // Make the column NOT NULL and unique
    await queryRunner.query(`
      ALTER TABLE "comments"
      ALTER COLUMN "comment_uuid" SET NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "comments"
      ADD CONSTRAINT "uq_comments_comment_uuid" UNIQUE ("comment_uuid");
    `);

    // Create index for faster lookups
    await queryRunner.query(`
      CREATE INDEX "idx_comments_comment_uuid" ON "comments" ("comment_uuid");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_comments_comment_uuid";`);

    // Drop unique constraint
    await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "uq_comments_comment_uuid";`);

    // Drop column
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN IF EXISTS "comment_uuid";`);
  }
}
