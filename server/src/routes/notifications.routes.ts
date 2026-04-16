import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.middleware';
import type { AuthUser } from '../middleware/auth.middleware';
import { notificationEngine } from '../services/notification-engine.service';
import prisma from '../config/database';

const router = new Hono<{ Variables: { user: AuthUser } }>();
router.use('*', authMiddleware);

// List notifications with filters
router.get('/', async (c) => {
  const { page = '1', limit = '20', status, type, trigger } = c.req.query();
  const where: any = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (trigger) where.triggerType = trigger;

  const [data, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: { project: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
    prisma.notification.count({ where }),
  ]);

  const formatted = data.map((n: any) => ({
    ...n,
    projectName: n.project?.name,
  }));

  return c.json({
    data: formatted,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

// Send manual notification
router.post('/send', async (c) => {
  const user = c.get('user');
  const { projectId, type, message } = await c.req.json();

  try {
    const notification = await notificationEngine.sendProgressUpdate(
      projectId,
      user.id,
      message,
    );
    return c.json({ status: 'success', data: notification });
  } catch (error: any) {
    return c.json({ status: 'error', message: error.message }, error.statusCode || 500);
  }
});

// Broadcast all updates
router.post('/broadcast-all', async (c) => {
  const user = c.get('user');
  try {
    const result = await notificationEngine.broadcastAllUpdates(user.id);
    return c.json({ status: 'success', data: result });
  } catch (error: any) {
    return c.json({ status: 'error', message: error.message }, 500);
  }
});

// Retry failed notification
router.post('/:id/retry', async (c) => {
  const notificationId = c.req.param('id');
  try {
    const notification = await notificationEngine.retryNotification(notificationId);
    return c.json({ status: 'success', data: notification });
  } catch (error: any) {
    return c.json({ status: 'error', message: error.message }, error.statusCode || 500);
  }
});

export default router;
