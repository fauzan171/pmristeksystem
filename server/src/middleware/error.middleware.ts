import { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { env } from '../config/env';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (err: Error, c: Context) => {
  if (err instanceof AppError) {
    return c.json({ status: 'error', message: err.message }, err.statusCode as ContentfulStatusCode);
  }

  console.error('Unhandled error:', err);

  return c.json({
    status: 'error',
    message: env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  }, 500);
};
