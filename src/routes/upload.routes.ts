// src/routes/upload.routes.ts
import { Router } from "express";
import { UploadController } from "../controllers/upload.controller";
import {
  uploadSingleImage,
  uploadQuerySchema,
} from "../middlewares/upload.middleware";
import { authenticateToken } from "../middlewares/auth.middleware";
import validate from "../middlewares/validate.middleware";

const router = Router();

// POST /api/upload/image - Upload single image to Neon Object Storage
// Body: multipart/form-data with field "image"
// Query param: ?folder=stories (default) or ?folder=avatars
router.post(
  "/image",
  authenticateToken,
  validate({ query: uploadQuerySchema }),
  uploadSingleImage,
  UploadController.uploadImage
);

export default router;
