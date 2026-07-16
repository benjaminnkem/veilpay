import { apiGet, apiPatch, apiPost } from '@/lib/api';
import type { AppNotification } from '@/features/notifications/types';
import type { PaginatedResponse, PaginationParams } from '@/types/api';

export async function getNotifications(
  params?: PaginationParams & { isRead?: boolean }
): Promise<PaginatedResponse<AppNotification>> {
  return apiGet('/notifications', { params });
}

export async function getUnreadCount(): Promise<{ count: number }> {
  return apiGet('/notifications/unread-count');
}

export async function markNotificationRead(
  id: string
): Promise<AppNotification> {
  return apiPatch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<{
  updated: number;
}> {
  return apiPost('/notifications/read-all');
}
