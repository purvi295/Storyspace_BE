// src/config/env.config.ts
// Loads and centralizes all environment variables using dotenv

import dotenv from 'dotenv';
import path from 'path';

// Explicitly load the .env file from the project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    name: process.env.DB_NAME || 'node-learning',
  },
};

export default config;
