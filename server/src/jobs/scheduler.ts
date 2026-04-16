import cron from 'node-cron';
import prisma from '../config/database';
import { whatsappService } from '../services/whatsapp.service';
import { notificationEngine } from '../services/notification-engine.service';
import { sessionManager } from '../services/session-manager.service';

/**
 * Job 1: Deadline Check (every day at 09:00)
 * Checks projects nearing their deadline and sends reminders.
 */
function scheduleDeadlineCheck(): void {
  cron.schedule('0 9 * * *', async () => {
    console.log('[Scheduler] Running deadline check...');

    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      // Find projects nearing deadline (within 3 days) that are not completed
      const projects = await prisma.project.findMany({
        where: {
          status: { in: ['ongoing', 'planning'] },
          deadline: {
            gte: now,
            lte: threeDaysFromNow,
          },
          waGroupId: { not: null },
        },
        include: { pm: true },
      });

      console.log(`[Scheduler] Found ${projects.length} projects nearing deadline`);

      for (const project of projects) {
        try {
          await notificationEngine.sendDeadlineReminder(project);
        } catch (error: any) {
          console.error(
            `[Scheduler] Failed to send deadline reminder for project ${project.id}: ${error.message}`,
          );
        }
      }
    } catch (error: any) {
      console.error(`[Scheduler] Deadline check error: ${error.message}`);
    }
  });
}

/**
 * Job 2: Overdue Check (every day at 09:05)
 * Checks overdue projects and sends alerts.
 */
function scheduleOverdueCheck(): void {
  cron.schedule('5 9 * * *', async () => {
    console.log('[Scheduler] Running overdue check...');

    try {
      const now = new Date();

      // Find overdue projects that are not completed
      const projects = await prisma.project.findMany({
        where: {
          status: { in: ['ongoing', 'planning', 'on_hold'] },
          deadline: { lt: now },
          waGroupId: { not: null },
        },
        include: { pm: true },
      });

      console.log(`[Scheduler] Found ${projects.length} overdue projects`);

      for (const project of projects) {
        try {
          await notificationEngine.sendOverdueAlert(project);
        } catch (error: any) {
          console.error(
            `[Scheduler] Failed to send overdue alert for project ${project.id}: ${error.message}`,
          );
        }
      }
    } catch (error: any) {
      console.error(`[Scheduler] Overdue check error: ${error.message}`);
    }
  });
}

/**
 * Job 3: Session Health Check (every 30 minutes)
 * Checks WhatsApp connection health and updates session status.
 */
function scheduleSessionHealthCheck(): void {
  cron.schedule('*/30 * * * *', async () => {
    console.log('[Scheduler] Running session health check...');

    try {
      const activeSessions = await sessionManager.getActiveSessions();
      const isActive = whatsappService.isActive();

      if (activeSessions.length > 0 && !isActive) {
        console.log('[Scheduler] WA session disconnected, updating status...');
        for (const session of activeSessions) {
          await sessionManager.updateStatus(session.userId, 'disconnected');
        }
      }

      if (isActive) {
        console.log('[Scheduler] WA session is healthy');
      }
    } catch (error: any) {
      console.error(`[Scheduler] Session health check error: ${error.message}`);
    }
  });
}

/**
 * Job 4: Retry Failed Notifications (every day at 12:00)
 * Retries notifications that failed in the last 24 hours.
 */
function scheduleRetryFailedNotifications(): void {
  cron.schedule('0 12 * * *', async () => {
    console.log('[Scheduler] Retrying failed notifications...');

    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const failedNotifications = await prisma.notification.findMany({
        where: {
          status: 'failed',
          createdAt: { gte: twentyFourHoursAgo },
        },
      });

      console.log(
        `[Scheduler] Found ${failedNotifications.length} failed notifications to retry`,
      );

      for (const notification of failedNotifications) {
        try {
          await notificationEngine.retryNotification(notification.id);
        } catch (error: any) {
          console.error(
            `[Scheduler] Failed to retry notification ${notification.id}: ${error.message}`,
          );
        }
      }
    } catch (error: any) {
      console.error(`[Scheduler] Retry notifications error: ${error.message}`);
    }
  });
}

/**
 * Start all cron jobs.
 */
export function startScheduler(): void {
  console.log('[Scheduler] Starting cron jobs...');

  scheduleDeadlineCheck();
  scheduleOverdueCheck();
  scheduleSessionHealthCheck();
  scheduleRetryFailedNotifications();

  console.log('[Scheduler] All cron jobs scheduled');
}
