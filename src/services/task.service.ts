// src/services/task.service.ts
// Business Logic Layer: Enforces domain rules, pagination calculations, and error throwing

import TaskRepository, { FindAllTaskOptions } from '../repositories/task.repository';
import ApiError from '../utils/api.error';
import { Task } from '../entities/task.entity';

export interface GetAllTasksQuery {
  page?: string | number;
  limit?: string | number;
  status?: string;
  priority?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const TaskService = {
  /**
   * Retrieve paginated and filtered tasks
   */
  async getAllTasks(queryParams: GetAllTasksQuery = {}) {
    const page = Math.max(1, parseInt(String(queryParams.page), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(queryParams.limit), 10) || 10));
    const offset = (page - 1) * limit;

    const filters: FindAllTaskOptions = {
      status: queryParams.status,
      priority: queryParams.priority,
      search: queryParams.search,
      sortBy: queryParams.sortBy,
      sortOrder: queryParams.sortOrder,
      limit,
      offset,
    };

    const [tasks, total] = await Promise.all([
      TaskRepository.findAll(filters),
      TaskRepository.count(filters),
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
  async getTaskById(id: number | string): Promise<Task> {
    const numericId = parseInt(String(id), 10);
    if (isNaN(numericId) || numericId <= 0) {
      throw ApiError.badRequest('Invalid task ID. ID must be a positive integer.');
    }

    const task = await TaskRepository.findById(numericId);
    if (!task) {
      throw ApiError.notFound(`Task with ID ${numericId} does not exist.`);
    }

    return task;
  },

  /**
   * Create a new task
   */
  async createTask(taskData: Partial<Task>): Promise<Task> {
    return await TaskRepository.create(taskData);
  },

  /**
   * Update an existing task
   */
  async updateTask(id: number | string, updateData: Partial<Task>): Promise<Task | null> {
    // 1. Verify existence first
    await this.getTaskById(id);

    // 2. Perform update
    return await TaskRepository.update(id, updateData);
  },

  /**
   * Delete a task
   */
  async deleteTask(id: number | string): Promise<boolean> {
    // 1. Verify existence first
    await this.getTaskById(id);

    // 2. Perform deletion
    return await TaskRepository.delete(id);
  },
};

export default TaskService;
