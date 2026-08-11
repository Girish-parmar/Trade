import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as templatesApi from '@/api/templates';

const templatesKey = (projectId: string) => ['projects', projectId, 'templates'];

export function useTemplates(projectId: string) {
  return useQuery({
    queryKey: templatesKey(projectId),
    queryFn: () => templatesApi.listTemplates(projectId),
    enabled: !!projectId,
  });
}

export function useCreateTemplate(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      items,
      description,
    }: {
      name: string;
      items: templatesApi.TemplateItemInput[];
      description?: string;
    }) => templatesApi.createTemplate(projectId, name, items, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templatesKey(projectId) });
    },
  });
}

export function useDeleteTemplate(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => templatesApi.deleteTemplate(projectId, templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templatesKey(projectId) });
    },
  });
}

export function useInstantiateTemplate(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, dueDateBase }: { templateId: string; dueDateBase?: string }) =>
      templatesApi.instantiateTemplate(projectId, templateId, dueDateBase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] });
    },
  });
}
