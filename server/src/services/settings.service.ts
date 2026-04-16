import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';

export const getSettings = async (userId: string) => {
  let settings = await prisma.notificationSetting.findUnique({
    where: { userId },
  });

  if (!settings) {
    // Create default settings
    settings = await prisma.notificationSetting.create({
      data: { userId },
    });
  }

  return settings;
};

export const updateSettings = async (
  userId: string,
  data: {
    deadlineReminderDays?: string;
    overdueNotifyEnabled?: boolean;
    overdueNotifyInterval?: string;
    notifyTime?: string;
    templateDeadline?: string;
    templateOverdue?: string;
    templateProgress?: string;
  }
) => {
  // Ensure settings exist first
  await getSettings(userId);

  const settings = await prisma.notificationSetting.update({
    where: { userId },
    data,
  });

  return settings;
};
