import { z } from 'zod';

export const updateSettingsSchema = z.object({
  deadlineReminderDays: z.string().optional(),
  overdueNotifyEnabled: z.boolean().optional(),
  overdueNotifyInterval: z.enum(['daily', 'weekly', 'biweekly']).optional(),
  notifyTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format').optional(),
  templateDeadline: z.string().optional().nullable(),
  templateOverdue: z.string().optional().nullable(),
  templateProgress: z.string().optional().nullable(),
});
