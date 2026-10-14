import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsDeleteToComments1800000008000 implements MigrationInterface {
  name = 'AddIsDeleteToComments1800000008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add is_delete column with default 0
    await queryRunner.query(`
      ALTER TABLE "comments"
      ADD COLUMN "is_delete" INT DEFAULT 0;
    `);

    // Create index on is_delete for faster filtering
    await queryRunner.query(`
      CREATE INDEX "idx_comments_is_delete" ON "comments" ("is_delete");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_comments_is_delete";`);

    // Drop column
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN IF EXISTS "is_delete";`);
  }
}
