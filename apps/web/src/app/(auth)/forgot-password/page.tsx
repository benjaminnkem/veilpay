import type { Metadata } from 'next';

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
      description="We will email you a secure reset link."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
