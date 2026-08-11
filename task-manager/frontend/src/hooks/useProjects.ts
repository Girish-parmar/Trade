import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as projectsApi from '@/api/projects';

export function useProjects() {
  return useQuery({ queryKey: ['projects'], queryFn: projectsApi.listProjects });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectsApi.getProject(projectId),
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      projectsApi.createProject(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useMembers(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'members'],
    queryFn: () => projectsApi.listMembers(projectId),
    enabled: !!projectId,
  });
}

export function useAddMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role?: 'ADMIN' | 'MEMBER' }) =>
      projectsApi.addMember(projectId, email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'members'] });
    },
  });
}

export function useTags(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'tags'],
    queryFn: () => projectsApi.listTags(projectId),
    enabled: !!projectId,
  });
}

export function useCreateTag(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) =>
      projectsApi.createTag(projectId, name, color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tags'] });
    },
  });
}
