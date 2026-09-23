import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Replaces the ambiguous stories.authorId with user_uuid and gives every story
 * a public UUID. Existing author values and foreign-key relationships are kept.
 */
export class RenameStoryUserAndAddStoryUuid1800000001000
  implements MigrationInterface
{
  name = "RenameStoryUserAndAddStoryUuid1800000001000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stories" RENAME COLUMN "authorId" TO "user_uuid";`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" RENAME CONSTRAINT "fk_stories_author" TO "fk_stories_user_uuid";`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_stories_author_id" RENAME TO "idx_stories_user_uuid";`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" ADD COLUMN "story_uuid" UUID NOT NULL DEFAULT gen_random_uuid();`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" ADD CONSTRAINT "uq_stories_story_uuid" UNIQUE ("story_uuid");`,
    );

    await queryRunner.query(`ALTER TABLE "comments" ADD COLUMN "story_uuid" UUID;`);
    await queryRunner.query(`
      UPDATE "comments" AS c
      SET "story_uuid" = story."story_uuid"
      FROM "stories" AS story
      WHERE c."story_id" = story."id";
    `);
    await queryRunner.query(`ALTER TABLE "comments" ALTER COLUMN "story_uuid" SET NOT NULL;`);
    await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "comments_story_id_fkey";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_comments_story_id";`);
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "story_id";`);
    await queryRunner.query(`
      ALTER TABLE "comments"
      ADD CONSTRAINT "fk_comments_story_uuid"
      FOREIGN KEY ("story_uuid") REFERENCES "stories"("story_uuid") ON DELETE CASCADE;
    `);
    await queryRunner.query(`CREATE INDEX "idx_comments_story_uuid" ON "comments" ("story_uuid");`);

    await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT IF EXISTS "uq_likes_story_user";`);
    await queryRunner.query(`ALTER TABLE "likes" ADD COLUMN "story_uuid" UUID;`);
    await queryRunner.query(`
      UPDATE "likes" AS l
      SET "story_uuid" = story."story_uuid"
      FROM "stories" AS story
      WHERE l."story_id" = story."id";
    `);
    await queryRunner.query(`ALTER TABLE "likes" ALTER COLUMN "story_uuid" SET NOT NULL;`);
    await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT IF EXISTS "likes_story_id_fkey";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_likes_story_id";`);
    await queryRunner.query(`ALTER TABLE "likes" DROP COLUMN "story_id";`);
    await queryRunner.query(`
      ALTER TABLE "likes"
      ADD CONSTRAINT "fk_likes_story_uuid"
      FOREIGN KEY ("story_uuid") REFERENCES "stories"("story_uuid") ON DELETE CASCADE;
    `);
    await queryRunner.query(`CREATE INDEX "idx_likes_story_uuid" ON "likes" ("story_uuid");`);
    await queryRunner.query(
      `ALTER TABLE "likes" ADD CONSTRAINT "uq_likes_story_user" UNIQUE ("story_uuid", "user_id");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "uq_likes_story_user";`);
    await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "fk_likes_story_uuid";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_likes_story_uuid";`);
    await queryRunner.query(`ALTER TABLE "likes" ADD COLUMN "story_id" INTEGER;`);
    await queryRunner.query(`
      UPDATE "likes" AS l
      SET "story_id" = story."id"
      FROM "stories" AS story
      WHERE l."story_uuid" = story."story_uuid";
    `);
    await queryRunner.query(`ALTER TABLE "likes" ALTER COLUMN "story_id" SET NOT NULL;`);
    await queryRunner.query(`ALTER TABLE "likes" DROP COLUMN "story_uuid";`);
    await queryRunner.query(
      `ALTER TABLE "likes" ADD CONSTRAINT "likes_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE;`,
    );
    await queryRunner.query(`CREATE INDEX "idx_likes_story_id" ON "likes" ("story_id");`);
    await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "uq_likes_story_user" UNIQUE ("story_id", "user_id");`);

    await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "fk_comments_story_uuid";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_comments_story_uuid";`);
    await queryRunner.query(`ALTER TABLE "comments" ADD COLUMN "story_id" INTEGER;`);
    await queryRunner.query(`
      UPDATE "comments" AS c
      SET "story_id" = story."id"
      FROM "stories" AS story
      WHERE c."story_uuid" = story."story_uuid";
    `);
    await queryRunner.query(`ALTER TABLE "comments" ALTER COLUMN "story_id" SET NOT NULL;`);
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "story_uuid";`);
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "comments_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE;`,
    );
    await queryRunner.query(`CREATE INDEX "idx_comments_story_id" ON "comments" ("story_id");`);
    await queryRunner.query(
      `ALTER TABLE "stories" DROP CONSTRAINT "uq_stories_story_uuid";`,
    );
    await queryRunner.query(`ALTER TABLE "stories" DROP COLUMN "story_uuid";`);
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_stories_user_uuid" RENAME TO "idx_stories_author_id";`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" RENAME CONSTRAINT "fk_stories_user_uuid" TO "fk_stories_author";`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" RENAME COLUMN "user_uuid" TO "authorId";`,
    );
  }
}
