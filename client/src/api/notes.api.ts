import apiClient from './client';
import type { Note, CreateNoteRequest, UpdateNoteRequest } from '../types';

function unwrap<T>(response: any): T {
  return response.data.data ?? response.data;
}

export const notesApi = {
  getAll: async (projectId: string): Promise<Note[]> => {
    const response = await apiClient.get(`/projects/${projectId}/notes`);
    const d = response.data;
    if (d.status === 'success' && Array.isArray(d.data)) return d.data;
    return Array.isArray(d) ? d : d.data || [];
  },

  create: async (projectId: string, data: CreateNoteRequest): Promise<Note> => {
    const response = await apiClient.post(`/projects/${projectId}/notes`, data);
    return unwrap(response);
  },

  update: async (projectId: string, noteId: string, data: UpdateNoteRequest): Promise<Note> => {
    const response = await apiClient.put(`/projects/${projectId}/notes/${noteId}`, data);
    return unwrap(response);
  },

  delete: async (projectId: string, noteId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/notes/${noteId}`);
  },
};
