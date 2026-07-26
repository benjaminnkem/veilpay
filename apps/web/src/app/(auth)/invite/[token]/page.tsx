import type { Metadata } from 'next';

import { AuthShell } from '@/components/layout/auth-shell';
import { AcceptInviteForm } from '@/features/auth/components/accept-invite-form';

export const metadata: Metadata = {
  title: 'Accept invitation',
  description: 'Join your organization on VeilPay and set your password.',
};

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <AuthShell
      title="Accept your invitation"
      description="Create your password to join the workspace."
    >
      <AcceptInviteForm token={token} />
    </AuthShell>
  );
}
