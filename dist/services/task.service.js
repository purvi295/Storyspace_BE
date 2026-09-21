"use strict";
// src/services/task.service.ts
// Business Logic Layer: Enforces domain rules, pagination calculations, and error throwing
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const task_repository_1 = __importDefault(require("../repositories/task.repository"));
const api_error_1 = __importDefault(require("../utils/api.error"));
exports.TaskService = {
    /**
     * Retrieve paginated and filtered tasks
     */
    async getAllTasks(queryParams = {}) {
        const page = Math.max(1, parseInt(String(queryParams.page), 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(String(queryParams.limit), 10) || 10));
        const offset = (page - 1) * limit;
        const filters = {
            status: queryParams.status,
            priority: queryParams.priority,
            search: queryParams.search,
            sortBy: queryParams.sortBy,
            sortOrder: queryParams.sortOrder,
            limit,
            offset,
        };
        const [tasks, total] = await Promise.all([
            task_repository_1.default.findAll(filters),
            task_repository_1.default.count(filters),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            tasks,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    },
    /**
     * Retrieve a single task by ID
     */
    async getTaskById(id) {
        const numericId = parseInt(String(id), 10);
        if (isNaN(numericId) || numericId <= 0) {
            throw api_error_1.default.badRequest('Invalid task ID. ID must be a positive integer.');
        }
        const task = await task_repository_1.default.findById(numericId);
        if (!task) {
            throw api_error_1.default.notFound(`Task with ID ${numericId} does not exist.`);
        }
        return task;
    },
    /**
     * Create a new task
     */
    async createTask(taskData) {
        return await task_repository_1.default.create(taskData);
    },
    /**
     * Update an existing task
     */
    async updateTask(id, updateData) {
        // 1. Verify existence first
        await this.getTaskById(id);
        // 2. Perform update
        return await task_repository_1.default.update(id, updateData);
    },
    /**
     * Delete a task
     */
    async deleteTask(id) {
        // 1. Verify existence first
        await this.getTaskById(id);
        // 2. Perform deletion
        return await task_repository_1.default.delete(id);
    },
};
exports.default = exports.TaskService;
