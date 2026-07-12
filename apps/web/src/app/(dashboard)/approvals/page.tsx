import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared';
import { ApprovalsList } from '@/features/approvals/components/approvals-list';

export const metadata: Metadata = {
  title: 'Approvals',
  description: 'Review payroll and compensation approval requests.',
};

export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals"
        description="Review and act on requests that require multi-party authorization."
      />
      <ApprovalsList />
    </div>
  );
}
