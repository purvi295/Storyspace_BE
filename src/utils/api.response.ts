// src/utils/api.response.ts
// Standardized API response format for all outgoing HTTP responses

import { Response } from 'express';

export interface ResponseMeta {
  [key: string]: unknown;
}

export interface PaginationMeta extends ResponseMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  currentPageTotal?: number;
  nextPage?: number | null;
  prevPage?: number | null;
}

export class ApiResponse<T = unknown> {
  public success: boolean;
  public statusCode: number;
  public message: string;
  public data?: T;
  public meta?: ResponseMeta;

  constructor(statusCode: number, data: T = {} as T, message = 'Success', meta: ResponseMeta = {}) {
    this.success = statusCode >= 200 && statusCode < 300;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.meta = meta;
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
  meta?: ResponseMeta
): Response => new ApiResponse(statusCode, data, message, meta).send(res);

/** Send the standard error response shape used by the global error handler. */
export const sendErrorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  meta?: ResponseMeta
): Response =>
  new ApiResponse<null>(statusCode, null, message, meta).send(res);

/** Send a standard response with pagination information in `meta`. */
export const sendPaginatedResponse = <T>(
  res: Response,
  data: T,
  pagination: PaginationMeta,
  message = 'Success',
  statusCode = 200,
): Response => new ApiResponse(statusCode, data, message, pagination).send(res);

export default ApiResponse;
