"use strict";
// src/server.ts
// Application Entry Point: Starts the HTTP server and initializes TypeORM DataSource
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const app_1 = __importDefault(require("./app"));
const env_config_1 = __importDefault(require("./config/env.config"));
const data_source_1 = require("./database/data-source");
const PORT = env_config_1.default.port;
let server;
const startServer = async () => {
    try {
        // 1. Initialize TypeORM DataSource connection
        await data_source_1.AppDataSource.initialize();
        console.log(`🗄️ TypeORM DataSource initialized successfully (${env_config_1.default.db.name})`);
        // 2. Start HTTP server
        server = app_1.default.listen(PORT, () => {
            console.log(`=========================================`);
            console.log(`🚀 Task API Server running on port ${PORT}`);
            console.log(`📡 Environment: ${env_config_1.default.nodeEnv}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
            console.log(`=========================================`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
// ==========================================
// Graceful Shutdown Handling
// ==========================================
const handleShutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    if (server) {
        server.close(async () => {
            console.log('✅ HTTP server closed.');
            try {
                if (data_source_1.AppDataSource.isInitialized) {
                    await data_source_1.AppDataSource.destroy();
                    console.log('✅ TypeORM DataSource connection closed.');
                }
            }
            catch (err) {
                console.error('Error closing TypeORM connection:', err);
            }
            process.exit(0);
        });
    }
    else {
        process.exit(0);
    }
    // Force shutdown after 10s if hanging
    setTimeout(() => {
        console.error('⚠️ Forcefully terminating after timeout');
        process.exit(1);
    }, 10000);
};
process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
exports.default = server;
