import { Context, Next } from 'hono';
import { ZodSchema } from 'zod';
import { AppError } from './error.middleware';

export const validate = (schema: ZodSchema) => async (c: Context, next: Next) => {
  try {
    const body = await c.req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      const errors = result.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json({ status: 'error', message: 'Validation failed', errors }, 400);
    }
    c.set('validatedBody', result.data);
    await next();
  } catch (error) {
    return c.json({ status: 'error', message: 'Invalid request body' }, 400);
  }
};
