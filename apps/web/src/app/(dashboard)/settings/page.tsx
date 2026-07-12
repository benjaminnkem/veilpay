import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared';
import { ProfileSettingsForm } from '@/features/settings/components/profile-settings-form';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your VeilPay profile and organization preferences.',
};

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Settings"
        description="Update account details and workspace preferences."
      />
      <ProfileSettingsForm />
    </div>
  );
}
