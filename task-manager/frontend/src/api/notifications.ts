import { apiClient } from './client';
import type { Notification } from '@/types';

export async function listNotifications(unreadOnly = false) {
  const res = await apiClient.get('/notifications', { params: { unread: unreadOnly } });
  return res.data.notifications as Notification[];
}

export async function markRead(id: string) {
  await apiClient.patch(`/notifications/${id}/read`);
}

export async function markAllRead() {
  await apiClient.patch('/notifications/read-all');
}
