import apiClient from './client';
import type { WAConnectionStatus, WAGroup, WASendMessageRequest } from '../types';

export const whatsappApi = {
  getStatus: async (): Promise<WAConnectionStatus> => {
    const response = await apiClient.get('/whatsapp/status');
    return response.data.data || response.data;
  },

  connect: async (): Promise<WAConnectionStatus> => {
    const response = await apiClient.post('/whatsapp/connect');
    return response.data.data || response.data;
  },

  disconnect: async (): Promise<void> => {
    await apiClient.post('/whatsapp/disconnect');
  },

  getGroups: async (): Promise<WAGroup[]> => {
    const response = await apiClient.get('/whatsapp/groups');
    return response.data.data || response.data;
  },

  sendMessage: async (data: WASendMessageRequest): Promise<{ success: boolean }> => {
    const response = await apiClient.post('/whatsapp/send', data);
    return response.data.data || response.data;
  },
};
