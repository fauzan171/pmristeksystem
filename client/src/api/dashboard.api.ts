import apiClient from './client';
import type { DashboardData } from '../types';

export const dashboardApi = {
  getData: async (): Promise<DashboardData> => {
    const response = await apiClient.get('/dashboard');
    return response.data.data || response.data;
  },
};
