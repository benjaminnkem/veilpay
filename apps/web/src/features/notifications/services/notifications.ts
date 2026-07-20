import { authGet, authPatch, authPost } from '@/lib/api';
import type { AppNotification } from '@/features/notifications/types';
import type { PaginatedResponse, PaginationParams } from '@/types/api';

export async function getNotifications(
  params?: PaginationParams & { isRead?: boolean }
): Promise<PaginatedResponse<AppNotification>> {
  return authGet('/notifications', { params });
}

export async function getUnreadCount(): Promise<{ count: number }> {
  return authGet('/notifications/unread-count');
}

export async function markNotificationRead(
  id: string
): Promise<AppNotification> {
  return authPatch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<{
  updated: number;
}> {
  return authPost('/notifications/read-all');
}
