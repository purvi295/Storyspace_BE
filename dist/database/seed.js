"use strict";
// src/database/seed.ts
// Seeds initial development data into PostgreSQL using TypeORM
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const data_source_1 = require("./data-source");
const user_entity_1 = require("../entities/user.entity");
const constants_1 = require("../config/constants");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const seed = async () => {
    try {
        console.log("\n🌱 Initializing TypeORM for seeding...");
        await data_source_1.AppDataSource.initialize();
        const userRepository = data_source_1.AppDataSource.getRepository(user_entity_1.User);
        const email = process.env.ADMIN_EMAIL;
        if (!email) {
            console.log("⚠️ ADMIN_EMAIL is not set in environment. Skipping admin creation.");
            console.log("🎉 Database seed check completed!\n");
            return;
        }
        const existingAdmin = await userRepository.findOneBy({ email });
        if (existingAdmin) {
            console.log("  ℹ️ Admin user already exists.");
        }
        else {
            const admin = userRepository.create({
                full_name: process.env.ADMIN_NAME || "System Admin",
                username: process.env.ADMIN_USERNAME || "admin",
                email: process.env.ADMIN_EMAIL,
                password: await bcryptjs_1.default.hash(process.env.ADMIN_PASSWORD || "Admin123!", 10),
                role: constants_1.ROLES.ADMIN,
            });
            await userRepository.save(admin);
            console.log("  ✅ Initial admin created");
        }
        console.log("🎉 Database seeded successfully!\n");
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
