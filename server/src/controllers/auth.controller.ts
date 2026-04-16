import { Context } from 'hono';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { env } from '../config/env';
import { AppError } from '../middleware/error.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

const SALT_ROUNDS = 12;

const generateToken = async (userId: string, role: string): Promise<string> => {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);
};

export const login = async (c: Context) => {
  const { email, password } = c.get('validatedBody');
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(401, 'Invalid email or password');
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) throw new AppError(401, 'Invalid email or password');
  const token = await generateToken(user.id, user.role);
  return c.json({ status: 'success', data: { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } } });
};

export const getMe = async (c: Context) => {
  const user = c.get('user');
  return c.json({ status: 'success', data: user });
};

export const logout = async (c: Context) => {
  return c.json({ status: 'success', message: 'Logged out successfully' });
};
