// src/repositories/task.repository.ts
// Data Access Layer: Uses TypeORM Repository & QueryBuilder

import { AppDataSource } from '../database/data-source';
import { Task } from '../entities/task.entity';

const getRepo = () => AppDataSource.getRepository(Task);

export interface FindAllTaskOptions {
  status?: string;
  priority?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: string;
}

export const TaskRepository = {
  /**
   * Find tasks with filtering, search, sorting, and pagination
   */
  async findAll({
    status,
    priority,
    search,
    limit = 50,
    offset = 0,
    sortBy = 'id',
    sortOrder = 'ASC',
  }: FindAllTaskOptions = {}): Promise<Task[]> {
    const repo = getRepo();
    const query = repo.createQueryBuilder('task');

    if (status) {
      query.andWhere('LOWER(task.status) = :status', { status: status.toLowerCase() });
    }

    if (priority) {
      query.andWhere('LOWER(task.priority) = :priority', { priority: priority.toLowerCase() });
    }

    if (search) {
      query.andWhere('(task.title ILIKE :search OR task.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const allowedSortFields: Record<string, string> = {
      id: 'task.id',
      title: 'task.title',
      status: 'task.status',
      priority: 'task.priority',
      created_at: 'task.createdAt',
      createdAt: 'task.createdAt',
    };

    const sortColumn = allowedSortFields[sortBy] || 'task.id';
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    query.orderBy(sortColumn, sortDirection);
    query.take(limit);
    query.skip(offset);

    return await query.getMany();
  },

  /**
   * Count total matching tasks for pagination metadata
   */
  async count({ status, priority, search }: { status?: string; priority?: string; search?: string } = {}): Promise<number> {
    const repo = getRepo();
    const query = repo.createQueryBuilder('task');

    if (status) {
      query.andWhere('LOWER(task.status) = :status', { status: status.toLowerCase() });
    }

    if (priority) {
      query.andWhere('LOWER(task.priority) = :priority', { priority: priority.toLowerCase() });
    }

    if (search) {
      query.andWhere('(task.title ILIKE :search OR task.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    return await query.getCount();
  },

  /**
   * Find a single task by ID
   */
  async findById(id: number | string): Promise<Task | null> {
    const repo = getRepo();
    return await repo.findOneBy({ id: Number(id) });
  },

  /**
   * Insert a new task
   */
  async create(data: Partial<Task>): Promise<Task> {
    const repo = getRepo();
    const newTask = repo.create({
      title: data.title,
      description: data.description || '',
      status: data.status || 'pending',
      priority: data.priority || 'medium',
    });
    return await repo.save(newTask);
  },

  /**
   * Update an existing task
   */
  async update(id: number | string, updateData: Partial<Task>): Promise<Task | null> {
    const repo = getRepo();
    const task = await repo.findOneBy({ id: Number(id) });
    if (!task) return null;

    if (updateData.title !== undefined) task.title = updateData.title;
    if (updateData.description !== undefined) task.description = updateData.description;
    if (updateData.status !== undefined) task.status = updateData.status;
    if (updateData.priority !== undefined) task.priority = updateData.priority;

    return await repo.save(task);
  },

  /**
   * Delete a task by ID
   */
  async delete(id: number | string): Promise<boolean> {
    const repo = getRepo();
    const result = await repo.delete(Number(id));
    return (result.affected || 0) > 0;
  },
};

export default TaskRepository;
