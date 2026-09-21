"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskModel = void 0;
// src/models/task.model.ts
const task_repository_1 = __importDefault(require("../repositories/task.repository"));
exports.TaskModel = task_repository_1.default;
exports.default = exports.TaskModel;
