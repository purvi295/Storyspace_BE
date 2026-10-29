// src/config/env.config.ts
// Loads and centralizes all environment variables using dotenv

import dotenv from 'dotenv';
import path from 'path';

// Explicitly load the .env file from the project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET;

// A predictable signing key allows attackers to forge tokens. Development may
// use a local secret, but production must provide a sufficiently strong one.
if (nodeEnv === 'production' && (!jwtSecret || jwtSecret.length < 32)) {
  throw new Error('JWT_SECRET must be set to at least 32 characters in production');
}

const positiveInteger = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const config = {
  port: positiveInteger(process.env.PORT, 3000),
  nodeEnv,
  jwt: {
    secret: jwtSecret || 'development-only-secret-do-not-use-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || (jwtSecret ? `${jwtSecret}_refresh` : 'development-only-refresh-secret-do-not-use-in-production'),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  db: {
    url: process.env.DATABASE_URL || '',
    host: process.env.DB_HOST || 'localhost',
    port: positiveInteger(process.env.DB_PORT, 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    name: process.env.DB_NAME || 'node-learning',
    ssl: process.env.DB_SSL === 'true' || !!process.env.DATABASE_URL,
    pool: {
      max: positiveInteger(process.env.DB_POOL_MAX, 10),
      min: positiveInteger(process.env.DB_POOL_MIN, 1),
      idleTimeoutMs: positiveInteger(process.env.DB_POOL_IDLE_TIMEOUT_MS, 30_000),
      connectionTimeoutMs: positiveInteger(process.env.DB_POOL_CONNECTION_TIMEOUT_MS, 5_000),
    },
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
