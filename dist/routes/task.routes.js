"use strict";
// src/routes/task.routes.ts
// Maps endpoint URLs and HTTP verbs to Task Controller handlers
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskController = __importStar(require("../controllers/task.controller"));
const validate_middleware_1 = __importDefault(require("../middlewares/validate.middleware"));
const task_validation_1 = require("../middlewares/task.validation");
const router = (0, express_1.Router)();
// Route: /api/tasks
router
    .route('/')
    .get(taskController.getTasks)
    .post((0, validate_middleware_1.default)(task_validation_1.createTaskSchema), taskController.createTask);
// Route: /api/tasks/:id
router
    .route('/:id')
    .get(taskController.getTaskById)
    .put((0, validate_middleware_1.default)(task_validation_1.updateTaskSchema), taskController.updateTask)
    .delete(taskController.deleteTask);
exports.default = router;
