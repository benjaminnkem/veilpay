import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared';
import { CreateInvitationDialog } from '@/features/invitations/components/create-invitation-dialog';
import { InvitationsTable } from '@/features/invitations/components/invitations-table';

export const metadata: Metadata = {
  title: 'Invitations',
  description: 'Invite teammates and track invitation status.',
};

export default function InvitationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Invitations"
        description="Invite HR, Finance, executives, and employees with secure expiring links."
        actions={<CreateInvitationDialog />}
      />
      <InvitationsTable />
    </div>
  );
}
