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

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  synchronize: false, // Use migrations
  logging: config.nodeEnv === 'development',
  entities: [User, Story, Follow, Comment, Like],
  migrations: [path.join(__dirname, 'migrations/*.ts')],
  subscribers: [],
});
