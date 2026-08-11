import { apiClient, setAccessToken } from './client';
import type { User } from '@/types';

export async function register(email: string, password: string, name: string) {
  const res = await apiClient.post('/auth/register', { email, password, name });
  setAccessToken(res.data.accessToken);
  return res.data.user as User;
}

export async function login(email: string, password: string) {
  const res = await apiClient.post('/auth/login', { email, password });
  setAccessToken(res.data.accessToken);
  return res.data.user as User;
}

export async function logout() {
  await apiClient.post('/auth/logout');
  setAccessToken(null);
}

export async function fetchMe() {
  const res = await apiClient.get('/auth/me');
  return res.data.user as User;
}
