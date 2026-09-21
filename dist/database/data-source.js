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
const task_entity_1 = require("../entities/task.entity");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: env_config_1.default.db.host,
    port: env_config_1.default.db.port,
    username: env_config_1.default.db.user,
    password: env_config_1.default.db.password,
    database: env_config_1.default.db.name,
    synchronize: false, // Use migrations
    logging: env_config_1.default.nodeEnv === 'development',
    entities: [task_entity_1.Task, path_1.default.join(__dirname, '../entities/**/*.ts')],
    migrations: [path_1.default.join(__dirname, 'migrations/*.ts')],
    subscribers: [],
});
exports.default = exports.AppDataSource;
