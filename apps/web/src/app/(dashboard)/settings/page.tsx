import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared';
import { SettingsWorkspace } from '@/features/settings/components/settings-workspace';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage profile, organization, and payroll preferences.',
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Profile, organization identity, and payroll approval defaults."
      />
      <SettingsWorkspace />
    </div>
  );
}
