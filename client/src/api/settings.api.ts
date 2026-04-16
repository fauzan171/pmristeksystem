import apiClient from './client';
import type { AppSettings } from '../types';

export const settingsApi = {
  get: async (): Promise<AppSettings> => {
    const response = await apiClient.get('/settings');
    return response.data.data || response.data;
  },

  update: async (data: Partial<AppSettings>): Promise<AppSettings> => {
    const response = await apiClient.put('/settings', data);
    return response.data.data || response.data;
  },
};
