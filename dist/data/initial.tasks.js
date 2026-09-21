"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialTasks = void 0;
// src/data/initial.tasks.ts
exports.initialTasks = [
    {
        id: 1,
        title: 'Learn Node.js Fundamentals',
        description: 'Understand the event loop, CommonJS modules, and asynchronous programming.',
        status: 'completed',
        priority: 'high',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: 2,
        title: 'Master Express.js & MVC Architecture',
        description: 'Learn request-response cycle, middlewares, routers, and controllers.',
        status: 'in-progress',
        priority: 'high',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 3,
        title: 'Integrate PostgreSQL with pg Pool',
        description: 'Migrate in-memory data store to relational PostgreSQL tables.',
        status: 'pending',
        priority: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];
exports.default = exports.initialTasks;
