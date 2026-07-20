import type { NotificationType } from './enums.js';
import type { PaginationQuery, Timestamps } from './common.js';
export interface Notification extends Timestamps {
    id: string;
    userId: string;
    organizationId: string | null;
    type: NotificationType;
    title: string;
    body: string;
    link: string | null;
    isRead: boolean;
    readAt: string | null;
    metadata: Record<string, unknown> | null;
}
export interface NotificationQuery extends PaginationQuery {
    isRead?: boolean;
    type?: NotificationType;
}
export interface UnreadCount {
    count: number;
}
//# sourceMappingURL=notification.d.ts.map