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

const multerSingleUploader = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
}).single("image");

const multerStoryUploader = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
}).fields([
  { name: "image", maxCount: 1 },
  { name: "coverImage", maxCount: 1 },
  { name: "cover_image", maxCount: 1 },
  { name: "cover_image_url", maxCount: 1 },
  { name: "avatar", maxCount: 1 },
]);

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
 * Middleware for direct /api/upload/image route
 */
export const uploadSingleImage = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  multerSingleUploader(req, res, (err: any) => {
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

/**
 * Optional multer middleware for routes like story creation and profile update,
 * allowing either JSON body or multipart form-data with an attached image.
 */
export const uploadOptionalImage = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    return next();
  }

  multerStoryUploader(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(
            ApiError.badRequest(
              "File size exceeds the 5MB limit. Please upload a smaller image."
            )
          );
        }
        return next(ApiError.badRequest(`Upload error: ${err.message}`));
      }
      return next(ApiError.badRequest(err.message || "Invalid file upload"));
    }

    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const uploadedFile =
        files.image?.[0] ||
        files.coverImage?.[0] ||
        files.cover_image?.[0] ||
        files.avatar?.[0];
      if (uploadedFile) {
        req.file = uploadedFile;
      }
    }

    next();
  });
};

export default uploadSingleImage;
