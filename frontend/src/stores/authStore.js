import { create } from 'zustand';
import apiClient, { formatApiError } from '../lib/api';

const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,
  error: null,

  checkAuth: async () => {
    try {
      const { data } = await apiClient.get('/auth/me');
      set({ user: data, isLoading: false });
    } catch (error) {
      set({ user: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      set({ user: data, error: null });
      return { success: true };
    } catch (error) {
      const errorMsg = formatApiError(error);
      set({ error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  register: async (email, password, name) => {
    try {
      const { data } = await apiClient.post('/auth/register', { email, password, name });
      set({ user: data, error: null });
      return { success: true };
    } catch (error) {
      const errorMsg = formatApiError(error);
      set({ error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
      set({ user: null, error: null });
      return { success: true };
    } catch (error) {
      return { success: false, error: formatApiError(error) };
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;