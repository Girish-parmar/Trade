import { apiClient } from './client';
import type { Project, ProjectMember, Tag } from '@/types';

export async function listProjects() {
  const res = await apiClient.get('/projects');
  return res.data.projects as Project[];
}

export async function createProject(name: string, description?: string) {
  const res = await apiClient.post('/projects', { name, description });
  return res.data.project as Project;
}

export async function getProject(projectId: string) {
  const res = await apiClient.get(`/projects/${projectId}`);
  return res.data.project as Project;
}

export async function listMembers(projectId: string) {
  const res = await apiClient.get(`/projects/${projectId}/members`);
  return res.data.members as ProjectMember[];
}

export async function addMember(projectId: string, email: string, role: 'ADMIN' | 'MEMBER' = 'MEMBER') {
  const res = await apiClient.post(`/projects/${projectId}/members`, { email, role });
  return res.data.member as ProjectMember;
}

export async function listTags(projectId: string) {
  const res = await apiClient.get(`/projects/${projectId}/tags`);
  return res.data.tags as Tag[];
}

export async function createTag(projectId: string, name: string, color: string) {
  const res = await apiClient.post(`/projects/${projectId}/tags`, { name, color });
  return res.data.tag as Tag;
}
