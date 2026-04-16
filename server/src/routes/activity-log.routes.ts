import { Hono } from 'hono';
import { getActivityLogs, getActivityStats } from '../controllers/activity-log.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = new Hono();
router.use('*', authMiddleware);
router.get('/', getActivityLogs);
router.get('/stats', getActivityStats);
export default router;
