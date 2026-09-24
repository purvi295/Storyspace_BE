"use strict";
// src/database/data-source.ts
// TypeORM DataSource Configuration
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const path_1 = __importDefault(require("path"));
const env_config_1 = __importDefault(require("../config/env.config"));
const user_entity_1 = require("../entities/user.entity");
const story_entity_1 = require("../entities/story.entity");
const follow_entity_1 = require("../entities/follow.entity");
const comment_entity_1 = require("../entities/comment.entity");
const like_entity_1 = require("../entities/like.entity");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    ...(env_config_1.default.db.url
        ? { url: env_config_1.default.db.url }
        : {
            host: env_config_1.default.db.host,
            port: env_config_1.default.db.port,
            username: env_config_1.default.db.user,
            password: env_config_1.default.db.password,
            database: env_config_1.default.db.name,
        }),
    ssl: env_config_1.default.db.ssl ? { rejectUnauthorized: false } : false,
    synchronize: false, // Use migrations
    logging: env_config_1.default.nodeEnv === 'development',
    entities: [user_entity_1.User, story_entity_1.Story, follow_entity_1.Follow, comment_entity_1.Comment, like_entity_1.Like],
    migrations: [path_1.default.join(__dirname, 'migrations/*.ts')],
    subscribers: [],
});
