import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as tasksApi from '@/api/tasks';
import type { Task, TaskStatus } from '@/types';

const tasksKey = (projectId: string) => ['projects', projectId, 'tasks'];

export function useTasks(projectId: string) {
  return useQuery({
    queryKey: tasksKey(projectId),
    queryFn: () => tasksApi.listTasks(projectId),
    enabled: !!projectId,
  });
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: tasksApi.CreateTaskInput) => tasksApi.createTask(projectId, input),
    onSuccess: (task) => {
      queryClient.setQueryData<Task[]>(tasksKey(projectId), (old) =>
        old ? [...old, task] : [task],
      );
    },
  });
}

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: tasksApi.UpdateTaskInput }) =>
      tasksApi.updateTask(projectId, taskId, input),
    onSuccess: (task) => {
      queryClient.setQueryData<Task[]>(tasksKey(projectId), (old) =>
        old ? old.map((t) => (t.id === task.id ? task : t)) : old,
      );
    },
  });
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.deleteTask(projectId, taskId),
    onSuccess: (_data, taskId) => {
      queryClient.setQueryData<Task[]>(tasksKey(projectId), (old) =>
        old ? old.filter((t) => t.id !== taskId) : old,
      );
    },
  });
}

export function useMoveTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      status,
      beforeId,
      afterId,
    }: {
      taskId: string;
      status: TaskStatus;
      beforeId?: string;
      afterId?: string;
    }) => tasksApi.moveTask(projectId, taskId, status, beforeId, afterId),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: tasksKey(projectId) });
      const previous = queryClient.getQueryData<Task[]>(tasksKey(projectId));
      queryClient.setQueryData<Task[]>(tasksKey(projectId), (old) =>
        old ? old.map((t) => (t.id === taskId ? { ...t, status } : t)) : old,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(tasksKey(projectId), context.previous);
      }
    },
    onSuccess: (task) => {
      queryClient.setQueryData<Task[]>(tasksKey(projectId), (old) =>
        old ? old.map((t) => (t.id === task.id ? task : t)) : old,
      );
    },
  });
}
