import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuthShell } from '@/components/layout/auth-shell';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

export const metadata: Metadata = {
  title: 'Forgot password',
  description: 'Reset access to your VeilPay account.',
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot password"
      description="Request a reset link, or set a new password from your email."
    >
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
