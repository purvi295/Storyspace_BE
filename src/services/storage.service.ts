// src/services/storage.service.ts
// Handles object storage operations on Neon Object Storage using S3-compatible API

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import config from '../config/env.config';
import crypto from 'crypto';
import path from 'path';

export class StorageService {
  private s3Client: S3Client;
  private bucket: string;
  private endpoint: string;

  constructor() {
    this.bucket = config.storage.bucket;
    this.endpoint = config.storage.endpoint;

    this.s3Client = new S3Client({
      region: config.storage.region || 'ap-southeast-1',
      endpoint: config.storage.endpoint,
      credentials: {
        accessKeyId: config.storage.accessKeyId,
        secretAccessKey: config.storage.secretAccessKey,
      },
      forcePathStyle: true, // Required for Neon Object Storage path-style addressing
    });
  }

  /**
   * Upload an image buffer to Neon Object Storage
   * @param file Express.Multer.File
   * @param folder Subfolder within the bucket (e.g., 'stories', 'avatars')
   * @returns {Promise<{ key: string; url: string }>}
   */
  uploadImage(
    file: Express.Multer.File,
    folder: string = 'stories'
  ): Promise<{ key: string; url: string }> {
    const fileExtension = path.extname(file.originalname) || '.jpg';
    const randomHex = crypto.randomBytes(8).toString('hex');
    const key = `${folder}/${Date.now()}-${randomHex}${fileExtension}`;

    // Promise-chain form of the upload workflow. Each .then() receives the
    // result of the preceding asynchronous operation.
    return this.s3Client
      .send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      )
      .then(() => {
        // This executes only after Neon S3 confirms the upload.
        const cleanEndpoint = this.endpoint.replace(/\/+$/, '');
        return { key, url: `${cleanEndpoint}/${this.bucket}/${key}` };
      })
      .catch((error: unknown) => {
        // Add useful context while preserving the original error as its cause.
        throw new Error(`Failed to upload image: ${file.originalname}`, {
          cause: error,
        });
      });
  }

  /**
   * Delete an object from Neon Object Storage by its key
   * @param key S3 object key
   */
  async deleteImage(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }
}

export const storageService = new StorageService();
