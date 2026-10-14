// src/controllers/upload.controller.ts
import { Request, Response } from 'express';
import { storageService } from '../services/storage.service';
import { sendApiResponse, sendErrorResponse } from '../utils/api.response';
import { AppError } from '../utils/api.error';

export class UploadController {
  static async uploadImage(req: Request, res: Response) {
    try {
      if (!req.file) {
        return sendErrorResponse(
          res,
          400,
          'Please provide an image file in form-data under field name "image"'
        );
      }

      const folder = (req.query.folder as string) || 'stories';
      const result = await storageService.uploadImage(req.file, folder);

      return sendApiResponse(
        res,
        200,
        {
          key: result.key,
          url: result.url,
          filename: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
        'Image uploaded successfully to Neon Object Storage'
      );
    } catch (error: unknown) {
      console.error('Neon storage upload error:', error);
      return sendErrorResponse(
        res,
        500,
        (error as Error).message || 'Failed to upload image to Neon Object Storage'
      );
    }
  }
}
