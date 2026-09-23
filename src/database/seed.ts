// src/database/seed.ts
// Seeds initial development data into PostgreSQL using TypeORM

import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { User } from "../entities/user.entity";
import { ROLES } from "../config/constants";
import bcrypt from "bcryptjs";

const seed = async () => {
  try {
    console.log("\n🌱 Initializing TypeORM for seeding...");
    await AppDataSource.initialize();

    const userRepository = AppDataSource.getRepository(User);

    const email = process.env.ADMIN_EMAIL;
    if (!email) {
      console.log("⚠️ ADMIN_EMAIL is not set in environment. Skipping admin creation.");
      console.log("🎉 Database seed check completed!\n");
      return;
    }

    const existingAdmin = await userRepository.findOneBy({ email });

    if (existingAdmin) {
      console.log("  ℹ️ Admin user already exists.");
    } else {
      const admin = userRepository.create({
        full_name: process.env.ADMIN_NAME || "System Admin",
        username: process.env.ADMIN_USERNAME || "admin",
        email: process.env.ADMIN_EMAIL!,
        password: await bcrypt.hash(process.env.ADMIN_PASSWORD || "Admin123!", 10),
        role: ROLES.ADMIN,
      });

      await userRepository.save(admin);
      console.log("  ✅ Initial admin created");
    }

    console.log("🎉 Database seeded successfully!\n");
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
