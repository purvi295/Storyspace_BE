"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTasksTable1700000000000 = void 0;
class CreateTasksTable1700000000000 {
    name = 'CreateTasksTable1700000000000';
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id" SERIAL PRIMARY KEY,
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
        "priority" VARCHAR(50) NOT NULL DEFAULT 'medium',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tasks_status" ON "tasks" ("status");
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tasks_priority" ON "tasks" ("priority");
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_tasks_priority";`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_tasks_status";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "tasks";`);
    }
}
exports.CreateTasksTable1700000000000 = CreateTasksTable1700000000000;
