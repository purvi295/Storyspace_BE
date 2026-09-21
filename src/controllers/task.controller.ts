// src/controllers/task.controller.ts
// HTTP Transport Layer: Extracts request data, calls TaskService, sends ApiResponse

import { Request, Response } from 'express';
import TaskService from '../services/task.service';
import ApiResponse from '../utils/api.response';
import asyncHandler from '../utils/async.handler';

/**
 * GET /api/tasks
 * Retrieve tasks with filtering, search, and pagination
 */
export const getTasks = asyncHandler(async (req: Request, res: Response) => {
  const result = await TaskService.getAllTasks(req.query);

  return new ApiResponse(
    200,
    result.tasks,
    'Tasks retrieved successfully',
    result.pagination
  ).send(res);
});

/**
 * GET /api/tasks/:id
 * Retrieve a single task by ID
 */
export const getTaskById = asyncHandler(async (req: Request, res: Response) => {
  const taskId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const task = await TaskService.getTaskById(taskId);

  return new ApiResponse(200, task, 'Task retrieved successfully').send(res);
});

/**
 * POST /api/tasks
 * Create a new task
 */
export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const newTask = await TaskService.createTask(req.body);

  return new ApiResponse(201, newTask, 'Task created successfully').send(res);
});

/**
 * PUT /api/tasks/:id
 * Update an existing task
 */
export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const taskId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const updatedTask = await TaskService.updateTask(taskId, req.body);

  return new ApiResponse(200, updatedTask, 'Task updated successfully').send(res);
});

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const taskId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await TaskService.deleteTask(taskId);

  return new ApiResponse(200, null, `Task with ID ${taskId} was deleted successfully`).send(res);
});

export default {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
