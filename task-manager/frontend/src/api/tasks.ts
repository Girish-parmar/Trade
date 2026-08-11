import { apiClient } from './client';
import type { Task, TaskPriority, TaskStatus } from '@/types';

export interface TaskFilters {
  status?: TaskStatus;
  assigneeId?: string;
  tagId?: string;
  priority?: TaskPriority;
  search?: string;
}

export async function listTasks(projectId: string, filters: TaskFilters = {}) {
  const res = await apiClient.get(`/projects/${projectId}/tasks`, { params: filters });
  return res.data.tasks as Task[];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
  tagIds?: string[];
}

export async function createTask(projectId: string, input: CreateTaskInput) {
  const res = await apiClient.post(`/projects/${projectId}/tasks`, input);
  return res.data.task as Task;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: string | null;
  assigneeId?: string | null;
  tagIds?: string[];
}

export async function updateTask(projectId: string, taskId: string, input: UpdateTaskInput) {
  const res = await apiClient.patch(`/projects/${projectId}/tasks/${taskId}`, input);
  return res.data.task as Task;
}

export async function deleteTask(projectId: string, taskId: string) {
  await apiClient.delete(`/projects/${projectId}/tasks/${taskId}`);
}

export async function moveTask(
  projectId: string,
  taskId: string,
  status: TaskStatus,
  beforeId?: string,
  afterId?: string,
) {
  const res = await apiClient.patch(`/projects/${projectId}/tasks/${taskId}/move`, {
    status,
    beforeId,
    afterId,
  });
  return res.data.task as Task;
}
