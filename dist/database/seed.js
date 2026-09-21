"use strict";
// src/database/seed.ts
// Seeds initial development tasks into PostgreSQL using TypeORM
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const data_source_1 = require("./data-source");
const task_entity_1 = require("../entities/task.entity");
const initialTasks = [
    {
        title: 'Learn Node.js Fundamentals',
        description: 'Understand the event loop, CommonJS modules, and asynchronous programming.',
        status: 'completed',
        priority: 'high',
    },
    {
        title: 'Master Express.js & Layered Architecture',
        description: 'Implement Routes, Controllers, Services, and Repositories following SoC.',
        status: 'in-progress',
        priority: 'high',
    },
    {
        title: 'Execute Database Migrations & Rollbacks',
        description: 'Manage production database schemas deterministically using TypeORM migrations.',
        status: 'pending',
        priority: 'high',
    },
    {
        title: 'Implement Security & Joi Request Validation',
        description: 'Ensure incoming HTTP payloads are strongly validated and sanitized.',
        status: 'pending',
        priority: 'medium',
    },
];
const seed = async () => {
    try {
        console.log('\n🌱 Initializing TypeORM for seeding...');
        await data_source_1.AppDataSource.initialize();
        const repo = data_source_1.AppDataSource.getRepository(task_entity_1.Task);
        console.log('🧹 Clearing existing tasks...');
        await repo.clear();
        console.log('➕ Seeding initial tasks...');
        for (const taskData of initialTasks) {
            const task = repo.create(taskData);
            await repo.save(task);
            console.log(`  ✅ Seeded task: "${task.title}"`);
        }
        console.log('🎉 Database seeded successfully!\n');
    }
    catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
    finally {
        if (data_source_1.AppDataSource.isInitialized) {
            await data_source_1.AppDataSource.destroy();
        }
    }
};
seed();
