import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommentsAndLikesTables1700000004000 implements MigrationInterface {
  name = 'CreateCommentsAndLikesTables1700000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Comments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "comments" (
        "id" SERIAL PRIMARY KEY,
        "story_id" INT NOT NULL REFERENCES "stories"("id") ON DELETE CASCADE,
        "user_id" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "content" TEXT NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_comments_story_id" ON "comments" ("story_id");`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_comments_user_id" ON "comments" ("user_id");`
    );

    // 2. Likes table — one like per user per story enforced via unique constraint
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "likes" (
        "id" SERIAL PRIMARY KEY,
        "story_id" INT NOT NULL REFERENCES "stories"("id") ON DELETE CASCADE,
        "user_id" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "uq_likes_story_user" UNIQUE ("story_id", "user_id")
      );
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_likes_story_id" ON "likes" ("story_id");`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_likes_user_id" ON "likes" ("user_id");`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop likes first (no dependents)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_likes_story_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_likes_user_id";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "likes" CASCADE;`);

    // Drop comments
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_comments_story_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_comments_user_id";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "comments" CASCADE;`);
  }
}
