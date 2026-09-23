"use strict";
// src/database/seed.ts
// Seeds initial development tasks into PostgreSQL using TypeORM
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const data_source_1 = require("./data-source");
const task_entity_1 = require("../entities/task.entity");
const user_entity_1 = require("../entities/user.entity");
const constants_1 = require("../config/constants");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const initialTasks = [
    {
        title: "Learn Node.js Fundamentals",
        description: "Understand the event loop, CommonJS modules, and asynchronous programming.",
        status: "completed",
        priority: "high",
    },
    {
        title: "Master Express.js & Layered Architecture",
        description: "Implement Routes, Controllers, Services, and Repositories following SoC.",
        status: "in-progress",
        priority: "high",
    },
    {
        title: "Execute Database Migrations & Rollbacks",
        description: "Manage production database schemas deterministically using TypeORM migrations.",
        status: "pending",
        priority: "high",
    },
    {
        title: "Implement Security & Joi Request Validation",
        description: "Ensure incoming HTTP payloads are strongly validated and sanitized.",
        status: "pending",
        priority: "medium",
    },
];
const seed = async () => {
    try {
        console.log("\n🌱 Initializing TypeORM for seeding...");
        await data_source_1.AppDataSource.initialize();
        const repo = data_source_1.AppDataSource.getRepository(task_entity_1.Task);
        console.log("🧹 Clearing existing tasks...");
        await repo.clear();
        console.log("➕ Seeding initial tasks...");
        for (const taskData of initialTasks) {
            const task = repo.create(taskData);
            await repo.save(task);
            console.log(`  ✅ Seeded task: "${task.title}"`);
        }
        console.log("🎉 Database seeded successfully!\n");
        const userRepository = data_source_1.AppDataSource.getRepository(user_entity_1.User);
        const email = process.env.ADMIN_EMAIL;
        const existingAdmin = await userRepository.findOneBy({ email });
        if (existingAdmin) {
            console.log("Admin already exists");
            return;
        }
        const admin = userRepository.create({
            full_name: process.env.ADMIN_NAME || "System Admin",
            username: process.env.ADMIN_USERNAME,
            email: process.env.ADMIN_EMAIL,
            password: await bcryptjs_1.default.hash(process.env.ADMIN_PASSWORD, 10),
            role: constants_1.ROLES.ADMIN,
        });
        await userRepository.save(admin);
        console.log("Initial admin created");
    }
    catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
    finally {
        if (data_source_1.AppDataSource.isInitialized) {
            await data_source_1.AppDataSource.destroy();
        }
    }
};
seed();
