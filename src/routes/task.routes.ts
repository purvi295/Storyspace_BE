// src/routes/task.routes.ts
// Maps endpoint URLs and HTTP verbs to Task Controller handlers

import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import validate from '../middlewares/validate.middleware';
import { createTaskSchema, updateTaskSchema } from '../middlewares/task.validation';

const router = Router();

// Route: /api/tasks
router
  .route('/')
  .get(taskController.getTasks)
  .post(validate(createTaskSchema), taskController.createTask);

// Route: /api/tasks/:id
router
  .route('/:id')
  .get(taskController.getTaskById)
  .put(validate(updateTaskSchema), taskController.updateTask)
  .delete(taskController.deleteTask);

export default router;
