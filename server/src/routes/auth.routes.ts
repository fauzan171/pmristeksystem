import { Hono } from 'hono';
import { login, getMe, logout } from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { loginSchema } from '../validators/auth.schema';

const router = new Hono();
router.post('/login', validate(loginSchema), login);
router.post('/logout', authMiddleware, logout);
router.get('/profile', authMiddleware, getMe);
export default router;
