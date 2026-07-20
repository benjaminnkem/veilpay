export interface AppNotification {
  id: string;
  userId: string;
  organizationId: string | null;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
