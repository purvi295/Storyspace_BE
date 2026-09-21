import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStoriesTable1789977255534 implements MigrationInterface {
  name = 'CreateStoriesTable1789977255534';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS stories (
        "id" SERIAL PRIMARY KEY,
        "authorId" INTEGER NOT NULL,
        "title" VARCHAR(255) NOT NULL,
        "slug" VARCHAR(300) NOT NULL UNIQUE,
        "content" TEXT NOT NULL,
        "summary" VARCHAR(500),
        "coverImageUrl" VARCHAR(500),
        "status" VARCHAR(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN (
            'draft',
            'submitted',
            'approved',
            'rejected',
            'published'
          )),
        "visibility" VARCHAR(20) NOT NULL DEFAULT 'public'
          CHECK (visibility IN (
            'public',
            'followers_only'
          )),
        "rejectionReason" TEXT,
        "published_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_stories_author
          FOREIGN KEY ("authorId")
          REFERENCES users(id)
          ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_stories_author_id
        ON stories ("authorId");

      CREATE INDEX IF NOT EXISTS idx_stories_status
        ON stories (status);

      CREATE INDEX IF NOT EXISTS idx_stories_visibility
        ON stories (visibility);

      CREATE INDEX IF NOT EXISTS idx_stories_published_at
        ON stories ("published_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_stories_author_id;
      DROP INDEX IF EXISTS idx_stories_status;
      DROP INDEX IF EXISTS idx_stories_visibility;
      DROP INDEX IF EXISTS idx_stories_published_at;
      DROP TABLE IF EXISTS stories;
    `);
  }
}
