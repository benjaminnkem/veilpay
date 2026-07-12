import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuthShell } from '@/components/layout/auth-shell';
import { LoadingState } from '@/components/shared';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your VeilPay workspace.',
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to manage confidential payroll."
    >
      <Suspense fallback={<LoadingState variant="form" rows={3} />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
