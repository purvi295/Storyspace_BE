// src/database/seed.ts
// Seeds initial development tasks into PostgreSQL using TypeORM

import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { Task } from "../entities/task.entity";
import { User } from "../entities/user.entity";
import { ROLES } from "../config/constants";
import bcrypt from "bcryptjs";

const initialTasks = [
  {
    title: "Learn Node.js Fundamentals",
    description:
      "Understand the event loop, CommonJS modules, and asynchronous programming.",
    status: "completed",
    priority: "high",
  },
  {
    title: "Master Express.js & Layered Architecture",
    description:
      "Implement Routes, Controllers, Services, and Repositories following SoC.",
    status: "in-progress",
    priority: "high",
  },
  {
    title: "Execute Database Migrations & Rollbacks",
    description:
      "Manage production database schemas deterministically using TypeORM migrations.",
    status: "pending",
    priority: "high",
  },
  {
    title: "Implement Security & Joi Request Validation",
    description:
      "Ensure incoming HTTP payloads are strongly validated and sanitized.",
    status: "pending",
    priority: "medium",
  },
];

const seed = async () => {
  try {
    console.log("\n🌱 Initializing TypeORM for seeding...");
    await AppDataSource.initialize();

    const repo = AppDataSource.getRepository(Task);

    console.log("🧹 Clearing existing tasks...");
    await repo.clear();

    console.log("➕ Seeding initial tasks...");
    for (const taskData of initialTasks) {
      const task = repo.create(taskData);
      await repo.save(task);
      console.log(`  ✅ Seeded task: "${task.title}"`);
    }

    console.log("🎉 Database seeded successfully!\n");

    const userRepository = AppDataSource.getRepository(User);

    const email = process.env.ADMIN_EMAIL!;
    const existingAdmin = await userRepository.findOneBy({ email });

    if (existingAdmin) {
      console.log("Admin already exists");
      return;
    }

    const admin = userRepository.create({
      full_name: process.env.ADMIN_NAME || "System Admin",
      username: process.env.ADMIN_USERNAME!,
      email: process.env.ADMIN_EMAIL!,
      password: await bcrypt.hash(process.env.ADMIN_PASSWORD!, 10),
      role: ROLES.ADMIN,
    });

    await userRepository.save(admin);
    console.log("Initial admin created");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
};

seed();
