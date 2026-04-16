import apiClient from './client';
import type { ActivityLog, PaginatedResponse, PaginationParams } from '../types';

function unwrapPaginated<T>(response: any): PaginatedResponse<T> {
  const d = response.data;
  if (d.status === 'success') {
    return { data: d.data || [], total: d.pagination?.total || 0, page: d.pagination?.page || 1, limit: d.pagination?.limit || 20, totalPages: d.pagination?.totalPages || 1 };
  }
  return d;
}

export const activityApi = {
  getAll: async (params?: PaginationParams & { projectId?: string; action?: string }): Promise<PaginatedResponse<ActivityLog>> => {
    const response = await apiClient.get('/activity', { params });
    return unwrapPaginated(response);
  },

  getByProject: async (projectId: string, params?: PaginationParams): Promise<PaginatedResponse<ActivityLog>> => {
    const response = await apiClient.get('/activity', { params: { ...params, projectId } });
    return unwrapPaginated(response);
  },
};
