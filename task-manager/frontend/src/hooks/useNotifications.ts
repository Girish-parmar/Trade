import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as notificationsApi from '@/api/notifications';
import { useAuth } from '@/contexts/AuthContext';

const notificationsKey = ['notifications'];

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: notificationsKey,
    queryFn: () => notificationsApi.listNotifications(),
    enabled: !!user,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });
}
