import prisma from '../config/database';
import { whatsappService } from './whatsapp.service';
import { AppError } from '../middleware/error.middleware';
import {
  buildDeadlineMessage,
  buildOverdueMessage,
  buildProgressMessage,
} from '../utils/template-engine';

class NotificationEngine {
  /**
   * Send a progress update notification for a project.
   */
  async sendProgressUpdate(
    projectId: string,
    userId: string,
    customMessage?: string,
  ): Promise<any> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { pm: true },
    });

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    if (!project.waGroupId) {
      throw new AppError(400, 'Project does not have a WhatsApp group configured');
    }

    // Get user's template settings
    const settings = await prisma.notificationSetting.findUnique({
      where: { userId },
    });

    const message =
      customMessage ||
      buildProgressMessage(settings?.templateProgress, {
        projectName: project.name,
        projectCode: project.projectCode,
        progress: project.progress,
        status: project.status,
        lastUpdated: project.lastUpdatedAt,
        lastNote: project.lastNote || undefined,
      });

    return this.sendAndLog({
      projectId: project.id,
      type: 'progress_update' as any,
      triggerType: 'manual',
      message,
      recipientGroup: project.waGroupId,
      createdBy: userId,
    });
  }

  /**
   * Send a deadline reminder for a project (with dedup check).
   */
  async sendDeadlineReminder(project: any): Promise<any> {
    const now = new Date();
    const deadline = new Date(project.deadline);
    const daysRemaining = Math.ceil(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Dedup check
    if (await this.hasSentToday(project.id, 'deadline_reminder')) {
      return null;
    }

    if (!project.waGroupId) return null;

    const settings = await prisma.notificationSetting.findUnique({
      where: { userId: project.pmId },
    });

    const message = buildDeadlineMessage(settings?.templateDeadline, {
      projectName: project.name,
      projectCode: project.projectCode,
      deadline: project.deadline,
      daysRemaining,
      progress: project.progress,
      pmName: project.pm?.name || 'Unknown',
      projectDescription: project.description || undefined,
    });

    return this.sendAndLog({
      projectId: project.id,
      type: 'deadline_reminder' as any,
      triggerType: 'cron',
      message,
      recipientGroup: project.waGroupId,
      createdBy: project.pmId,
    });
  }

  /**
   * Send an overdue alert for a project (with dedup check).
   */
  async sendOverdueAlert(project: any): Promise<any> {
    const now = new Date();
    const deadline = new Date(project.deadline);
    const daysOverdue = Math.ceil(
      (now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Dedup check
    if (await this.hasSentToday(project.id, 'overdue_alert')) {
      return null;
    }

    if (!project.waGroupId) return null;

    const settings = await prisma.notificationSetting.findUnique({
      where: { userId: project.pmId },
    });

    const message = buildOverdueMessage(settings?.templateOverdue, {
      projectName: project.name,
      projectCode: project.projectCode,
      deadline: project.deadline,
      daysOverdue,
      progress: project.progress,
      pmName: project.pm?.name || 'Unknown',
    });

    return this.sendAndLog({
      projectId: project.id,
      type: 'overdue_alert' as any,
      triggerType: 'cron',
      message,
      recipientGroup: project.waGroupId,
      createdBy: project.pmId,
    });
  }

  /**
   * Broadcast progress updates for all ongoing projects of a user.
   */
  async broadcastAllUpdates(userId: string): Promise<{ sent: number; failed: number }> {
    const projects = await prisma.project.findMany({
      where: {
        pmId: userId,
        status: 'ongoing',
        waGroupId: { not: null },
      },
    });

    let sent = 0;
    let failed = 0;

    for (const project of projects) {
      try {
        await this.sendProgressUpdate(project.id, userId);
        sent++;
      } catch {
        failed++;
      }
    }

    return { sent, failed };
  }

  /**
   * Retry a failed notification.
   */
  async retryNotification(notificationId: string): Promise<any> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new AppError(404, 'Notification not found');
    }

    if (notification.status !== 'failed') {
      throw new AppError(400, 'Only failed notifications can be retried');
    }

    return this.sendAndLog({
      projectId: notification.projectId,
      type: notification.type,
      triggerType: 'retry',
      message: notification.message,
      recipientGroup: notification.recipientGroup,
      createdBy: notification.createdBy,
      retryOf: notificationId,
    });
  }

  /**
   * Check if a notification of a given type has already been sent today for a project.
   */
  async hasSentToday(projectId: string, type: string): Promise<boolean> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const count = await prisma.notification.count({
      where: {
        projectId,
        type: type as any,
        status: { in: ['pending', 'sent', 'delivered'] },
        createdAt: { gte: startOfDay },
      },
    });

    return count > 0;
  }

  /**
   * Core method: send message via WhatsApp and log to DB.
   */
  private async sendAndLog(params: {
    projectId: string;
    type: any;
    triggerType: string;
    message: string;
    recipientGroup: string | null;
    createdBy: string | null;
    retryOf?: string;
  }): Promise<any> {
    // Create notification record as pending
    const notification = await prisma.notification.create({
      data: {
        projectId: params.projectId,
        type: params.type,
        triggerType: params.triggerType,
        message: params.message,
        recipientGroup: params.recipientGroup,
        createdBy: params.createdBy,
        status: 'pending',
      },
    });

    try {
      if (!whatsappService.isActive()) {
        throw new Error('WhatsApp is not connected');
      }

      if (!params.recipientGroup) {
        throw new Error('No recipient group configured');
      }

      const sent = await whatsappService.sendMessage(params.recipientGroup, params.message);

      // Update notification as sent
      const updated = await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
          recipientId: sent?.key?.id || null,
        },
      });

      return updated;
    } catch (error: any) {
      // Mark notification as failed
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'failed',
          errorMessage: error.message || 'Unknown error',
        },
      });

      throw new AppError(500, `Failed to send notification: ${error.message}`);
    }
  }
}

export const notificationEngine = new NotificationEngine();
