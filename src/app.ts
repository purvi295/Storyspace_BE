// src/app.ts
// Express application configuration (middlewares, route mounting)

import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";
import crypto from "crypto";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import storyRoutes from "./routes/story.routes";
import commentRoutes from "./routes/comment.routes";
import uploadRoutes from "./routes/upload.routes";
import adminRoutes from "./routes/admin.routes";
import internalRoutes from "./routes/internal.routes";
import { notFoundHandler, errorHandler } from "./middlewares/error.handler";
import { logger } from "./utils/logger";

const app: Application = express();

// ==========================================
// 1. Core Global Middlewares
// ==========================================
// Helmet automatically sets secure HTTP headers:
// - X-Content-Type-Options: nosniff
// - X-Frame-Options: SAMEORIGIN
// - Strict-Transport-Security (HSTS)
// - Content-Security-Policy
// - X-DNS-Prefetch-Control
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  pinoHttp({
    logger,
    genReqId: (req) =>
      (req.headers["x-request-id"] as string | undefined) || crypto.randomUUID(),
    customProps: (req) => ({ userId: req.user?.user_uuid }),
  })
);

// ==========================================
// 2. Application Domain Routes
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/internal", internalRoutes);

// ==========================================
// 4. Error Handling Middlewares
// ==========================================
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
