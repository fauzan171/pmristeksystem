import apiClient from './client';
import type { Project, CreateProjectRequest, UpdateProjectRequest, PaginatedResponse, PaginationParams } from '../types';

export const projectsApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Project>> => {
    const response = await apiClient.get('/projects', { params });
    const d = response.data;
    // Handle both { data: [...], pagination: {...} } and { status, data: [...], pagination: {...} }
    if (d.status === 'success' && d.data) {
      return { data: d.data, total: d.pagination?.total || d.data.length, page: d.pagination?.page || 1, limit: d.pagination?.limit || 10, totalPages: d.pagination?.totalPages || 1 };
    }
    return d;
  },

  getById: async (id: string): Promise<Project> => {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data.data || response.data;
  },

  create: async (data: CreateProjectRequest): Promise<Project> => {
    const response = await apiClient.post('/projects', data);
    return response.data.data || response.data;
  },

  update: async (id: string, data: UpdateProjectRequest): Promise<Project> => {
    const response = await apiClient.put(`/projects/${id}`, data);
    return response.data.data || response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },

  updateStatus: async (id: string, status: string): Promise<Project> => {
    const response = await apiClient.patch(`/projects/${id}/status`, { status });
    return response.data.data || response.data;
  },

  updateProgress: async (id: string, progress: number): Promise<Project> => {
    const response = await apiClient.patch(`/projects/${id}/progress`, { progress });
    return response.data.data || response.data;
  },
};
