import { Context } from 'hono';
import * as activityLogService from '../services/activity-log.service';

export const getActivityLogs = async (c: Context) => {
  const { page = '1', limit = '20', projectId, action, performedBy, startDate, endDate } = c.req.query();
  const result = await activityLogService.getActivityLogs({
    page: parseInt(page, 10), limit: parseInt(limit, 10),
    projectId: projectId as string | undefined, action: action as string | undefined,
    performedBy: performedBy as string | undefined, startDate: startDate as string | undefined,
    endDate: endDate as string | undefined,
  });
  return c.json({ status: 'success', ...result });
};

export const getActivityStats = async (c: Context) => {
  const stats = await activityLogService.getActivityStats();
  return c.json({ status: 'success', data: stats });
};
