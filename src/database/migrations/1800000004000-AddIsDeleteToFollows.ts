import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsDeleteToFollows1800000004000 implements MigrationInterface {
  name = "AddIsDeleteToFollows1800000004000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the explicit soft-delete flag used to unfollow/re-follow without
    // ever inserting a duplicate (follower_id, following_id) pair.
    await queryRunner.query(
      `ALTER TABLE "follows" ADD COLUMN IF NOT EXISTS "is_delete" SMALLINT NOT NULL DEFAULT 0;`,
    );

    // Rows that were previously soft-deleted (deleted_at set) become is_delete = 1
    // so the new flag stays consistent with the existing timestamp column.
    await queryRunner.query(
      `UPDATE "follows" SET "is_delete" = 1 WHERE "deleted_at" IS NOT NULL;`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_follows_is_delete" ON "follows" ("is_delete");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_follows_is_delete";`);
    await queryRunner.query(
      `ALTER TABLE "follows" DROP COLUMN IF EXISTS "is_delete";`,
    );
  }
}
