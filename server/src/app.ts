import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';
import type { AuthUser } from './middleware/auth.middleware';

interface Variables {
  user: AuthUser;
  validatedBody: any;
}

const app = new Hono<{ Variables: Variables }>();

app.use('*', cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use('*', logger());

app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/projects.routes';
import notesRoutes from './routes/notes.routes';
import dashboardRoutes from './routes/dashboard.routes';
import activityLogRoutes from './routes/activity-log.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import notificationRoutes from './routes/notifications.routes';
import settingsRoutes from './routes/settings.routes';

app.route('/api/auth', authRoutes);
app.route('/api/projects', projectRoutes);
app.route('/api/projects/:projectId/notes', notesRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/activity', activityLogRoutes);
app.route('/api/whatsapp', whatsappRoutes);
app.route('/api/notifications', notificationRoutes);
app.route('/api/settings', settingsRoutes);

app.onError((err, c) => errorHandler(err, c));

export default app;
