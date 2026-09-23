"use strict";
// src/app.ts
// Express application configuration (middlewares, route mounting)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const story_routes_1 = __importDefault(require("./routes/story.routes"));
const comment_routes_1 = __importDefault(require("./routes/comment.routes"));
const error_handler_1 = require("./middlewares/error.handler");
const app = (0, express_1.default)();
// ==========================================
// 1. Core Global Middlewares
// ==========================================
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ==========================================
// 2. Health Check Endpoint
// ==========================================
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "healthy",
        message: "API is running smoothly",
        timestamp: new Date().toISOString(),
    });
});
// ==========================================
// 3. Application Routes
// ==========================================
app.use("/api/auth", auth_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.use("/api/stories", story_routes_1.default);
app.use("/api/comments", comment_routes_1.default);
// ==========================================
// 4. Error Handling Middlewares
// ==========================================
app.use(error_handler_1.notFoundHandler);
app.use(error_handler_1.errorHandler);
exports.default = app;
