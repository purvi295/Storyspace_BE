// src/app.ts
// Express application configuration (middlewares, route mounting)

import express, { Application, Request, Response } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import storyRoutes from "./routes/story.routes";
import commentRoutes from "./routes/comment.routes";
import uploadRoutes from "./routes/upload.routes";
import adminRoutes from "./routes/admin.routes";
import { notFoundHandler, errorHandler } from "./middlewares/error.handler";

const app: Application = express();

// ==========================================
// 1. Core Global Middlewares
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 2. Health Check Endpoint
// ==========================================
app.get("/api/health", (req: Request, res: Response) => {
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
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);

// ==========================================
// 4. Error Handling Middlewares
// ==========================================
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
