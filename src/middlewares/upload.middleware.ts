// src/middlewares/upload.middleware.ts
import multer from "multer";
import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import ApiError from "../utils/api.error";

// Store files in memory buffer for direct upload to Neon S3 storage
const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed."
      )
    );
  }
};

const multerUploader = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
}).single("image");

/**
 * Validates folder query parameter for upload
 */
export const uploadQuerySchema = Joi.object({
  folder: Joi.string()
    .valid("stories", "avatars")
    .default("stories")
    .messages({
      "any.only": "Folder must be either 'stories' or 'avatars'",
    }),
});

/**
 * Middleware that wraps multer to intercept MulterError and fileFilter errors,
 * converting them to clean, descriptive 400 Bad Request responses.
 */
export const uploadSingleImage = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  multerUploader(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(
            ApiError.badRequest(
              "File size exceeds the 5MB limit. Please upload a smaller image."
            )
          );
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return next(
            ApiError.badRequest(
              "Unexpected field. Image must be sent in form-data with key 'image'."
            )
          );
        }
        return next(ApiError.badRequest(`Upload error: ${err.message}`));
      }
      return next(ApiError.badRequest(err.message || "Invalid file upload"));
    }
    next();
  });
};

export default uploadSingleImage;
