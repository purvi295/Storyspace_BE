// src/database/migrations/1800000010000-CreateRefreshTokensTable.ts
// Migration to create the refresh_tokens table for token rotation and revocation

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshTokensTable1800000010000 implements MigrationInterface {
  name = 'CreateRefreshTokensTable1800000010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "token_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_uuid" UUID NOT NULL,
        "token_hash" VARCHAR(64) NOT NULL UNIQUE,
        "is_revoked" BOOLEAN NOT NULL DEFAULT FALSE,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_refresh_tokens_user" FOREIGN KEY ("user_uuid") REFERENCES "users"("user_uuid") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user_uuid" ON "refresh_tokens" ("user_uuid");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_token_hash" ON "refresh_tokens" ("token_hash");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens" CASCADE;`);
  }
}
