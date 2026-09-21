"use strict";
// src/repositories/task.repository.ts
// Data Access Layer: Uses TypeORM Repository & QueryBuilder
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRepository = void 0;
const data_source_1 = require("../database/data-source");
const task_entity_1 = require("../entities/task.entity");
const getRepo = () => data_source_1.AppDataSource.getRepository(task_entity_1.Task);
exports.TaskRepository = {
    /**
     * Find tasks with filtering, search, sorting, and pagination
     */
    async findAll({ status, priority, search, limit = 50, offset = 0, sortBy = 'id', sortOrder = 'ASC', } = {}) {
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
        const allowedSortFields = {
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
    async count({ status, priority, search } = {}) {
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
    async findById(id) {
        const repo = getRepo();
        return await repo.findOneBy({ id: Number(id) });
    },
    /**
     * Insert a new task
     */
    async create(data) {
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
    async update(id, updateData) {
        const repo = getRepo();
        const task = await repo.findOneBy({ id: Number(id) });
        if (!task)
            return null;
        if (updateData.title !== undefined)
            task.title = updateData.title;
        if (updateData.description !== undefined)
            task.description = updateData.description;
        if (updateData.status !== undefined)
            task.status = updateData.status;
        if (updateData.priority !== undefined)
            task.priority = updateData.priority;
        return await repo.save(task);
    },
    /**
     * Delete a task by ID
     */
    async delete(id) {
        const repo = getRepo();
        const result = await repo.delete(Number(id));
        return (result.affected || 0) > 0;
    },
};
exports.default = exports.TaskRepository;
