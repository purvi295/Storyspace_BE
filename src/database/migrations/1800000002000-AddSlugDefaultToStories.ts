import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSlugDefaultToStories1800000002000 implements MigrationInterface {
  name = 'AddSlugDefaultToStories1800000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add default value to slug column to prevent NOT NULL constraint violations
    await queryRunner.query(`
      ALTER TABLE stories 
      ALTER COLUMN "slug" SET DEFAULT '';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the default value
    await queryRunner.query(`
      ALTER TABLE stories 
      ALTER COLUMN "slug" DROP DEFAULT;
    `);
  }
}