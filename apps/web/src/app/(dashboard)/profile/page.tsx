import { PageHeader } from '@/components/shared';
import { PayoutWalletCard } from '@/features/settings/components/payout-wallet-card';
import { ProfileSettingsForm } from '@/features/settings/components/profile-settings-form';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your account identity and payroll payout wallet."
      />
      <ProfileSettingsForm />
      <PayoutWalletCard />
    </div>
  );
}
