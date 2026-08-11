import { apiClient } from './client';
import type { Task, TaskPriority, TaskTemplate } from '@/types';

export interface TemplateItemInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueOffsetDays?: number;
}

export async function listTemplates(projectId: string) {
  const res = await apiClient.get(`/projects/${projectId}/templates`);
  return res.data.templates as TaskTemplate[];
}

export async function createTemplate(
  projectId: string,
  name: string,
  items: TemplateItemInput[],
  description?: string,
) {
  const res = await apiClient.post(`/projects/${projectId}/templates`, {
    name,
    description,
    items,
  });
  return res.data.template as TaskTemplate;
}

export async function deleteTemplate(projectId: string, templateId: string) {
  await apiClient.delete(`/projects/${projectId}/templates/${templateId}`);
}

export async function instantiateTemplate(
  projectId: string,
  templateId: string,
  dueDateBase?: string,
) {
  const res = await apiClient.post(`/projects/${projectId}/templates/${templateId}/instantiate`, {
    dueDateBase,
  });
  return res.data.tasks as Task[];
}
