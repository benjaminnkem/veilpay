import { PageHeader } from '@/components/shared';
import { ProfileSettingsForm } from '@/features/settings/components/profile-settings-form';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your account identity across this workspace."
      />
      <ProfileSettingsForm />
    </div>
  );
}
