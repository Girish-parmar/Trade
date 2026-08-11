import { apiClient } from './client';
import type { User } from '@/types';

export async function searchUsers(query: string) {
  if (!query.trim()) return [];
  const res = await apiClient.get('/users/search', { params: { q: query } });
  return res.data.users as User[];
}
