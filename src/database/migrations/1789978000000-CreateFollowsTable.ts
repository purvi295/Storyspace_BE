import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFollowsTable1789978000000 implements MigrationInterface {
  name = 'CreateFollowsTable1789978000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "follows" (
        "id" SERIAL PRIMARY KEY,
        "follower_id" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "following_id" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "uq_follows_follower_following" UNIQUE ("follower_id", "following_id"),
        CONSTRAINT "chk_cannot_follow_self" CHECK ("follower_id" != "following_id")
      );
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_follows_follower_id" ON "follows" ("follower_id");`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_follows_following_id" ON "follows" ("following_id");`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_follows_follower_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_follows_following_id";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "follows" CASCADE;`);
  }
}
