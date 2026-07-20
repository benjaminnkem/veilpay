'use client';

import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/features/notifications/services/notifications';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useQueryClient } from '@tanstack/react-query';

export const notificationsQueryKey = ['notifications'] as const;
export const unreadCountQueryKey = ['notifications', 'unread-count'] as const;

export function useNotifications() {
  return useApiQuery({
    queryKey: notificationsQueryKey,
    queryFn: () => getNotifications({ pageSize: 50 }),
  });
}

export function useUnreadCount() {
  return useApiQuery({
    queryKey: unreadCountQueryKey,
    queryFn: getUnreadCount,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: markNotificationRead,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: notificationsQueryKey });
      await qc.invalidateQueries({ queryKey: unreadCountQueryKey });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: notificationsQueryKey });
      await qc.invalidateQueries({ queryKey: unreadCountQueryKey });
    },
  });
}
