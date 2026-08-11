import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as commentsApi from '@/api/comments';

const commentsKey = (taskId: string) => ['tasks', taskId, 'comments'];

export function useComments(taskId: string) {
  return useQuery({
    queryKey: commentsKey(taskId),
    queryFn: () => commentsApi.listComments(taskId),
    enabled: !!taskId,
  });
}

export function useCreateComment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => commentsApi.createComment(taskId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentsKey(taskId) });
    },
  });
}

export function useDeleteComment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => commentsApi.deleteComment(taskId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentsKey(taskId) });
    },
  });
}
