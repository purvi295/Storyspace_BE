// src/server.ts
// Application Entry Point: Starts the HTTP server and initializes TypeORM DataSource

import 'reflect-metadata';
import app from './app';
import config from './config/env.config';
import { AppDataSource } from './database/data-source';
import { Server } from 'http';

const PORT = config.port;

let server: Server;

const startServer = async () => {
  try {
    // 1. Initialize TypeORM DataSource connection
    await AppDataSource.initialize();
    console.log(`🗄️ TypeORM DataSource initialized successfully (${config.db.name})`);

    // 2. Start HTTP server
    server = app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 API Server running on port ${PORT}`);
      console.log(`📡 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`=========================================`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// ==========================================
// Graceful Shutdown Handling
// ==========================================
const handleShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      console.log('✅ HTTP server closed.');
      try {
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
          console.log('✅ TypeORM DataSource connection closed.');
        }
      } catch (err) {
        console.error('Error closing TypeORM connection:', err);
      }
      process.exit(0);
    });
  } else {
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

export default server;
