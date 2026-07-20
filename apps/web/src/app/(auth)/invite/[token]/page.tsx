import type { Metadata } from 'next';

import { AcceptInviteForm } from '@/features/auth/components/accept-invite-form';

export const metadata: Metadata = {
  title: 'Accept invitation',
  description: 'Join your organization on VeilPay.',
};

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <AcceptInviteForm token={token} />;
}
