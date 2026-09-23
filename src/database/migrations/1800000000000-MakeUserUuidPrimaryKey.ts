import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Converts the users primary key and all user foreign keys from integer IDs to UUIDs.
 * This intentionally deletes data in users and their dependent tables before changing
 * column types. It must run after AddUserUuid1790000000000.
 */
export class MakeUserUuidPrimaryKey1800000000000 implements MigrationInterface {
  name = 'MakeUserUuidPrimaryKey1800000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`TRUNCATE TABLE "users" CASCADE;`);

    await queryRunner.query(`ALTER TABLE "follows" DROP CONSTRAINT IF EXISTS "follows_follower_id_fkey";`);
    await queryRunner.query(`ALTER TABLE "follows" DROP CONSTRAINT IF EXISTS "follows_following_id_fkey";`);
    await queryRunner.query(`ALTER TABLE "follows" DROP CONSTRAINT IF EXISTS "uq_follows_follower_following";`);
    await queryRunner.query(`ALTER TABLE "follows" DROP CONSTRAINT IF EXISTS "chk_cannot_follow_self";`);
    await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "comments_user_id_fkey";`);
    await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT IF EXISTS "likes_user_id_fkey";`);
    await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT IF EXISTS "uq_likes_story_user";`);
    await queryRunner.query(`ALTER TABLE "stories" DROP CONSTRAINT IF EXISTS "fk_stories_author";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_follows_follower_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_follows_following_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_comments_user_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_likes_user_id";`);

    await queryRunner.query(`ALTER TABLE "follows" DROP COLUMN "follower_id", DROP COLUMN "following_id";`);
    await queryRunner.query(`ALTER TABLE "follows" ADD COLUMN "follower_id" UUID NOT NULL, ADD COLUMN "following_id" UUID NOT NULL;`);
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "user_id";`);
    await queryRunner.query(`ALTER TABLE "comments" ADD COLUMN "user_id" UUID NOT NULL;`);
    await queryRunner.query(`ALTER TABLE "likes" DROP COLUMN "user_id";`);
    await queryRunner.query(`ALTER TABLE "likes" ADD COLUMN "user_id" UUID NOT NULL;`);
    await queryRunner.query(`ALTER TABLE "stories" DROP COLUMN "authorId";`);
    await queryRunner.query(`ALTER TABLE "stories" ADD COLUMN "authorId" UUID NOT NULL;`);

    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "users_pkey";`);
    // Keep the generated numeric ID as a unique internal reference, but no longer
    // use it as the table's primary key or for user foreign-key relationships.
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_users_id" ON "users" ("id");`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_user_uuid";`);
    await queryRunner.query(`ALTER TABLE "users" ADD PRIMARY KEY ("user_uuid");`);

    await queryRunner.query(`ALTER TABLE "follows" ADD CONSTRAINT "fk_follows_follower_uuid" FOREIGN KEY ("follower_id") REFERENCES "users"("user_uuid") ON DELETE CASCADE;`);
    await queryRunner.query(`ALTER TABLE "follows" ADD CONSTRAINT "fk_follows_following_uuid" FOREIGN KEY ("following_id") REFERENCES "users"("user_uuid") ON DELETE CASCADE;`);
    await queryRunner.query(`ALTER TABLE "follows" ADD CONSTRAINT "uq_follows_follower_following" UNIQUE ("follower_id", "following_id");`);
    await queryRunner.query(`ALTER TABLE "follows" ADD CONSTRAINT "chk_cannot_follow_self" CHECK ("follower_id" != "following_id");`);
    await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "fk_comments_user_uuid" FOREIGN KEY ("user_id") REFERENCES "users"("user_uuid") ON DELETE CASCADE;`);
    await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "fk_likes_user_uuid" FOREIGN KEY ("user_id") REFERENCES "users"("user_uuid") ON DELETE CASCADE;`);
    await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "uq_likes_story_user" UNIQUE ("story_id", "user_id");`);
    await queryRunner.query(`ALTER TABLE "stories" ADD CONSTRAINT "fk_stories_author" FOREIGN KEY ("authorId") REFERENCES "users"("user_uuid") ON DELETE CASCADE;`);

    await queryRunner.query(`CREATE INDEX "idx_follows_follower_id" ON "follows" ("follower_id");`);
    await queryRunner.query(`CREATE INDEX "idx_follows_following_id" ON "follows" ("following_id");`);
    await queryRunner.query(`CREATE INDEX "idx_comments_user_id" ON "comments" ("user_id");`);
    await queryRunner.query(`CREATE INDEX "idx_likes_user_id" ON "likes" ("user_id");`);
  }

  public async down(): Promise<void> {
    throw new Error('This destructive UUID primary-key migration cannot be reverted automatically.');
  }
}
