"use strict";
// src/controllers/task.controller.ts
// HTTP Transport Layer: Extracts request data, calls TaskService, sends ApiResponse
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.createTask = exports.getTaskById = exports.getTasks = void 0;
const task_service_1 = __importDefault(require("../services/task.service"));
const api_response_1 = __importDefault(require("../utils/api.response"));
const async_handler_1 = __importDefault(require("../utils/async.handler"));
/**
 * GET /api/tasks
 * Retrieve tasks with filtering, search, and pagination
 */
exports.getTasks = (0, async_handler_1.default)(async (req, res) => {
    const result = await task_service_1.default.getAllTasks(req.query);
    return new api_response_1.default(200, result.tasks, 'Tasks retrieved successfully', result.pagination).send(res);
});
/**
 * GET /api/tasks/:id
 * Retrieve a single task by ID
 */
exports.getTaskById = (0, async_handler_1.default)(async (req, res) => {
    const taskId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const task = await task_service_1.default.getTaskById(taskId);
    return new api_response_1.default(200, task, 'Task retrieved successfully').send(res);
});
/**
 * POST /api/tasks
 * Create a new task
 */
exports.createTask = (0, async_handler_1.default)(async (req, res) => {
    const newTask = await task_service_1.default.createTask(req.body);
    return new api_response_1.default(201, newTask, 'Task created successfully').send(res);
});
/**
 * PUT /api/tasks/:id
 * Update an existing task
 */
exports.updateTask = (0, async_handler_1.default)(async (req, res) => {
    const taskId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updatedTask = await task_service_1.default.updateTask(taskId, req.body);
    return new api_response_1.default(200, updatedTask, 'Task updated successfully').send(res);
});
/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
exports.deleteTask = (0, async_handler_1.default)(async (req, res) => {
    const taskId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await task_service_1.default.deleteTask(taskId);
    return new api_response_1.default(200, null, `Task with ID ${taskId} was deleted successfully`).send(res);
});
exports.default = {
    getTasks: exports.getTasks,
    getTaskById: exports.getTaskById,
    createTask: exports.createTask,
    updateTask: exports.updateTask,
    deleteTask: exports.deleteTask,
};
