// src/database/data-source.ts
// TypeORM DataSource Configuration

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'path';
import config from '../config/env.config';

import { User } from '../entities/user.entity';
import { Story } from '../entities/story.entity';
import { Follow } from '../entities/follow.entity';
import { Comment } from '../entities/comment.entity';
import { Like } from '../entities/like.entity';
import { RefreshToken } from '../entities/refresh-token.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...(config.db.url
    ? { url: config.db.url }
    : {
        host: config.db.host,
        port: config.db.port,
        username: config.db.user,
        password: config.db.password,
        database: config.db.name,
      }),
  ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
  // =========================================================================
  // Explicit Connection Pool Configuration (pg / node-postgres pool)
  // - max: Maximum number of clients in the pool (prevents exhausting DB connections)
  // - min: Minimum number of idle connections kept ready
  // - idleTimeoutMillis: How long an idle connection can remain before being closed
  // - connectionTimeoutMillis: How long to wait when acquiring a connection from pool
  // =========================================================================
  extra: {
    max: config.db.pool.max,
    min: config.db.pool.min,
    idleTimeoutMillis: config.db.pool.idleTimeoutMs,
    connectionTimeoutMillis: config.db.pool.connectionTimeoutMs,
    statement_timeout: 15000, // 15-second query timeout to prevent hanging connections
  },
  synchronize: false, // Strict migration control
  logging: config.nodeEnv === 'development',
  entities: [User, Story, Follow, Comment, Like, RefreshToken],
  migrations: [path.join(__dirname, 'migrations/*.ts')],
  subscribers: [],
});
