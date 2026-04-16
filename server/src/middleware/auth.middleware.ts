import { Context, Next } from 'hono';
import { jwtVerify, SignJWT } from 'jose';
import { env } from '../config/env';
import prisma from '../config/database';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ status: 'error', message: 'Access token is missing or invalid' }, 401);
    }

    const token = authHeader.split(' ')[1];
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      return c.json({ status: 'error', message: 'User no longer exists' }, 401);
    }

    c.set('user', user);
    await next();
  } catch (error) {
    return c.json({ status: 'error', message: 'Invalid or expired token' }, 401);
  }
};
