import { create } from 'zustand';
import type { User } from '../types';
import { authApi } from '../api/auth.api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('rpms_user') || 'null'),
  token: localStorage.getItem('rpms_token'),
  isAuthenticated: !!localStorage.getItem('rpms_token'),
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login({ email, password });
      localStorage.setItem('rpms_token', response.token);
      localStorage.setItem('rpms_user', JSON.stringify(response.user));
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('rpms_token');
    localStorage.removeItem('rpms_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const user = await authApi.getProfile();
      localStorage.setItem('rpms_user', JSON.stringify(user));
      set({ user });
    } catch {
      set({ user: null, token: null, isAuthenticated: false });
      localStorage.removeItem('rpms_token');
      localStorage.removeItem('rpms_user');
    }
  },
}));
