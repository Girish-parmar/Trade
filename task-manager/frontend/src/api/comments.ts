import { apiClient } from './client';
import type { Comment } from '@/types';

export async function listComments(taskId: string) {
  const res = await apiClient.get(`/tasks/${taskId}/comments`);
  return res.data.comments as Comment[];
}

export async function createComment(taskId: string, body: string) {
  const res = await apiClient.post(`/tasks/${taskId}/comments`, { body });
  return res.data.comment as Comment;
}

export async function deleteComment(taskId: string, commentId: string) {
  await apiClient.delete(`/tasks/${taskId}/comments/${commentId}`);
}
