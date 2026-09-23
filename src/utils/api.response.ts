// src/utils/api.response.ts
// Standardized API response format for all outgoing HTTP responses

import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  currentPageTotal?: number;
  nextPage?: number | null;
  prevPage?: number | null;
}

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

/** Send the standard successful API response shape. */
export const sendApiResponse = <T>(
  res: Response,
  statusCode: number,
  data: T,
  message = 'Success',
): Response => new ApiResponse(statusCode, data, message).send(res);

/** Send the standard error response shape used by the global error handler. */
export const sendErrorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  details?: unknown,
): Response =>
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(details !== undefined && { details }),
  });

/** Send a standard response with pagination information in `meta`. */
export const sendPaginatedResponse = <T>(
  res: Response,
  data: T,
  pagination: PaginationMeta,
  message = 'Success',
  statusCode = 200,
): Response => new ApiResponse(statusCode, data, message, pagination).send(res);

export default ApiResponse;
