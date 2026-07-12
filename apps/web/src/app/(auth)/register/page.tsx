import type { Metadata } from 'next';

import { AuthShell } from '@/components/layout/auth-shell';
import { RegisterForm } from '@/features/auth/components/register-form';

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Create a VeilPay organization and start confidential payroll.',
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Set up your organization on VeilPay."
    >
      <RegisterForm />
    </AuthShell>
  );
}
