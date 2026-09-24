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
    url: process.env.DATABASE_URL || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    name: process.env.DB_NAME || 'node-learning',
    ssl: process.env.DB_SSL === 'true' || !!process.env.DATABASE_URL,
  },
  storage: {
    endpoint: process.env.AWS_ENDPOINT_URL_S3 || '',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'ap-southeast-1',
    bucket: process.env.NEON_STORAGE_BUCKET || 'story',
  },
};

export default config;
