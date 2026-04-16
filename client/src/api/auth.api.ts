import apiClient from './client';
import type { LoginRequest, LoginResponse, User } from '../types';

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<{ status: string; data: LoginResponse }>('/auth/login', data);
    return response.data.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<{ status: string; data: User }>('/auth/profile');
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};
