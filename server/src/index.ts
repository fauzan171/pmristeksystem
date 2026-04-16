import { serve } from '@hono/node-server';
import { env } from './config/env';
import app from './app';
import { startScheduler } from './jobs/scheduler';

const server = serve(
  {
    fetch: app.fetch,
    port: parseInt(env.PORT, 10),
  },
  (info) => {
    console.log(`RPMS Server running on http://localhost:${info.port} [${env.NODE_ENV}]`);

    // Start cron jobs (deadline check, overdue alert, session health, retry)
    startScheduler();
  }
);

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.close();
  process.exit(0);
});
