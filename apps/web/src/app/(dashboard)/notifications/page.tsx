import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared';
import { NotificationsList } from '@/features/notifications/components/notifications-list';

export const metadata: Metadata = {
  title: 'Notifications',
  description: 'In-app notifications for payroll and approvals.',
};

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay on top of approvals, payroll events, and invitations."
      />
      <NotificationsList />
    </div>
  );
}
