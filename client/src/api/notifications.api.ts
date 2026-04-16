import apiClient from './client';
import type { Notification, PaginatedResponse, PaginationParams } from '../types';

function unwrapPaginated<T>(response: any): PaginatedResponse<T> {
  const d = response.data;
  if (d.status === 'success') {
    return { data: d.data || [], total: d.pagination?.total || 0, page: d.pagination?.page || 1, limit: d.pagination?.limit || 20, totalPages: d.pagination?.totalPages || 1 };
  }
  return d;
}

export const notificationsApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Notification>> => {
    const response = await apiClient.get('/notifications', { params });
    return unwrapPaginated(response);
  },

  sendDeadlineReminder: async (projectId: string): Promise<Notification> => {
    const response = await apiClient.post(`/notifications/deadline-reminder/${projectId}`);
    return response.data.data || response.data;
  },

  sendStatusUpdate: async (projectId: string): Promise<Notification> => {
    const response = await apiClient.post(`/notifications/status-update/${projectId}`);
    return response.data.data || response.data;
  },

  retry: async (notificationId: string): Promise<Notification> => {
    const response = await apiClient.post(`/notifications/${notificationId}/retry`);
    return response.data.data || response.data;
  },

  sendAllUpdates: async (): Promise<{ sent: number }> => {
    const response = await apiClient.post('/notifications/send-all');
    return response.data.data || response.data;
  },
};
