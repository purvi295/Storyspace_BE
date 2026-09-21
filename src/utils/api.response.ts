// src/utils/api.response.ts
// Standardized API response format for all outgoing HTTP responses

import { Response } from 'express';

export class ApiResponse<T = any> {
  public success: boolean;
  public statusCode: number;
  public message: string;
  public data?: T;
  public meta?: any;

  constructor(statusCode: number, data: T = null as any, message = 'Success', meta: any = null) {
    this.success = statusCode >= 200 && statusCode < 300;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== null && data !== undefined) {
      this.data = data;
    }
    if (meta) {
      this.meta = meta;
    }
  }

  send(res: Response): Response {
    return res.status(this.statusCode).json(this);
  }
}

export default ApiResponse;
