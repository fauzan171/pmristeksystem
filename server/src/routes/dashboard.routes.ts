import { Hono } from 'hono';
import { getDashboardSummary } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = new Hono();
router.use('*', authMiddleware);
router.get('/', getDashboardSummary);
export default router;
