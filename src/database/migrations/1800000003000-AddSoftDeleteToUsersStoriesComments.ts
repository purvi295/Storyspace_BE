import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftDeleteToUsersStoriesComments1800000003000 implements MigrationInterface {
  name = "AddSoftDeleteToUsersStoriesCommentsFollows1800000003000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP WITH TIME ZONE;`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_users_deleted_at" ON "users" ("deleted_at");`,
    );

    await queryRunner.query(
      `ALTER TABLE "stories" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP WITH TIME ZONE;`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_stories_deleted_at" ON "stories" ("deleted_at");`,
    );

    await queryRunner.query(
      `ALTER TABLE "follows" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP WITH TIME ZONE;`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_follows_deleted_at" ON "follows" ("deleted_at");`,
    );

    await queryRunner.query(
      `ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP WITH TIME ZONE;`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_comments_deleted_at" ON "comments" ("deleted_at");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_comments_deleted_at";`);
    await queryRunner.query(
      `ALTER TABLE "comments" DROP COLUMN IF EXISTS "deleted_at";`,
    );

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_stories_deleted_at";`);
    await queryRunner.query(
      `ALTER TABLE "stories" DROP COLUMN IF EXISTS "deleted_at";`,
    );

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_deleted_at";`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "deleted_at";`,
    );
  }
}
