import { Context } from 'hono';
import * as dashboardService from '../services/dashboard.service';

export const getDashboardSummary = async (c: Context) => {
  const summary = await dashboardService.getDashboardSummary();
  return c.json({ status: 'success', data: summary });
};
