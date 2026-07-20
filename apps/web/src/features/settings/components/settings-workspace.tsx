'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { InputField, PasswordField } from '@/components/forms';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfidentialPayoutCard } from '@/features/settings/components/confidential-payout-card';
import { PayoutWalletCard } from '@/features/settings/components/payout-wallet-card';
import { ProfileSettingsForm } from '@/features/settings/components/profile-settings-form';
import { TreasurySettings } from '@/features/settings/components/treasury-settings';
import {
  getOrganization,
  updateOrganization,
} from '@/features/settings/services/updateProfile';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { authGet, authPatch, authPost } from '@/lib/api';
import {
  canEditOrgSettings,
  canManageTreasury,
} from '@/lib/auth/rbac';
import { notify } from '@/lib/toast';
import { cn } from '@/lib/utils';

const orgSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  legalName: z.string().optional(),
  currency: z.string().min(1),
  timezone: z.string().min(1),
});

const securitySchema = z
  .object({
    currentPassword: z.string().min(8, 'Current password is required'),
    newPassword: z.string().min(8, 'Use at least 8 characters'),
    confirmPassword: z.string().min(8),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type OrgFormValues = z.infer<typeof orgSchema>;
type SecurityFormValues = z.infer<typeof securitySchema>;

const settingsSchema = z.object({
  fiscalYearStartMonth: z.number().min(1).max(12),
  payrollApprovalRequired: z.boolean(),
  autoGeneratePayrollItems: z.boolean(),
  notificationEmailEnabled: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsWorkspace() {
  const { user } = useCurrentUser();
  const showOrgTab =
    canEditOrgSettings(user?.role) || canManageTreasury(user?.role);
  const showPayrollTab = canEditOrgSettings(user?.role);
  const tabCount = 2 + (showOrgTab ? 1 : 0) + (showPayrollTab ? 1 : 0);

  const orgQuery = useQuery({
    queryKey: ['organization', 'me'],
    queryFn: getOrganization,
    enabled: showOrgTab || canManageTreasury(user?.role),
  });

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: () =>
      authGet<{
        id: string;
        payrollApprovalRequired: boolean;
        autoGeneratePayrollItems: boolean;
        notificationEmailEnabled: boolean;
        fiscalYearStartMonth: number;
        defaultApprovalSequence: string[];
      }>('/settings'),
    enabled: showPayrollTab,
  });

  const orgForm = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    values: {
      name: orgQuery.data?.name ?? '',
      legalName: orgQuery.data?.legalName ?? '',
      currency: orgQuery.data?.currency ?? 'USD',
      timezone: orgQuery.data?.timezone ?? 'UTC',
    },
  });

  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    values: {
      fiscalYearStartMonth: settingsQuery.data?.fiscalYearStartMonth ?? 1,
      payrollApprovalRequired:
        settingsQuery.data?.payrollApprovalRequired ?? true,
      autoGeneratePayrollItems:
        settingsQuery.data?.autoGeneratePayrollItems ?? true,
      notificationEmailEnabled:
        settingsQuery.data?.notificationEmailEnabled ?? false,
    },
  });

  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onOrgSubmit = orgForm.handleSubmit(async (values) => {
    try {
      await updateOrganization({
        name: values.name,
        legalName: values.legalName || null,
        currency: values.currency,
        timezone: values.timezone,
      });
      notify.success('Organization updated');
      await orgQuery.refetch();
    } catch (error) {
      notify.error(error);
    }
  });

  const onSettingsSubmit = settingsForm.handleSubmit(async (values) => {
    try {
      await authPatch('/settings', values);
      notify.success('Settings updated');
      await settingsQuery.refetch();
    } catch (error) {
      notify.error(error);
    }
  });

  const onSecuritySubmit = securityForm.handleSubmit(async (values) => {
    try {
      await authPost('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      notify.success('Password updated');
      securityForm.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      notify.error(error);
    }
  });

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList
        className={cn(
          'grid w-full max-w-2xl',
          tabCount === 2 && 'grid-cols-2',
          tabCount === 3 && 'grid-cols-3',
          tabCount >= 4 && 'grid-cols-4',
        )}
      >
        <TabsTrigger value="profile">Profile</TabsTrigger>
        {showOrgTab ? (
          <TabsTrigger value="organization">Organization</TabsTrigger>
        ) : null}
        {showPayrollTab ? (
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        ) : null}
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-4">
        <ProfileSettingsForm />
        <PayoutWalletCard />
        <ConfidentialPayoutCard />
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Access</CardTitle>
            <CardDescription>
              Role{' '}
              <span className="font-medium capitalize text-foreground">
                {String(user?.role ?? '-').replaceAll('_', ' ').toLowerCase()}
              </span>
            </CardDescription>
          </CardHeader>
        </Card>
      </TabsContent>

      {showOrgTab ? (
        <TabsContent value="organization" className="space-y-4">
          {canEditOrgSettings(user?.role) ? (
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Organization</CardTitle>
                <CardDescription>
                  Legal identity, branding, and payroll currency for this
                  workspace.
                </CardDescription>
              </CardHeader>
              <form onSubmit={onOrgSubmit}>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    control={orgForm.control}
                    name="name"
                    label="Name"
                  />
                  <InputField
                    control={orgForm.control}
                    name="legalName"
                    label="Legal name"
                  />
                  <InputField
                    control={orgForm.control}
                    name="currency"
                    label="Payroll currency"
                  />
                  <InputField
                    control={orgForm.control}
                    name="timezone"
                    label="Timezone"
                  />
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    disabled={orgForm.formState.isSubmitting}
                  >
                    {orgForm.formState.isSubmitting
                      ? 'Saving…'
                      : 'Save organization'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          ) : null}

          {canManageTreasury(user?.role) ? <TreasurySettings /> : null}
        </TabsContent>
      ) : null}

      {showPayrollTab ? (
        <TabsContent value="payroll">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Payroll rules</CardTitle>
            <CardDescription>
              Approval and generation defaults for this workspace.
            </CardDescription>
          </CardHeader>
          <form onSubmit={onSettingsSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="fiscalYearStartMonth"
                >
                  Fiscal year start month (1-12)
                </label>
                <input
                  id="fiscalYearStartMonth"
                  type="number"
                  min={1}
                  max={12}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={settingsForm.watch('fiscalYearStartMonth')}
                  onChange={(e) =>
                    settingsForm.setValue(
                      'fiscalYearStartMonth',
                      Number(e.target.value) || 1
                    )
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border"
                  checked={settingsForm.watch('payrollApprovalRequired')}
                  onChange={(e) =>
                    settingsForm.setValue(
                      'payrollApprovalRequired',
                      e.target.checked
                    )
                  }
                />
                Require multi-level payroll approval
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border"
                  checked={settingsForm.watch('autoGeneratePayrollItems')}
                  onChange={(e) =>
                    settingsForm.setValue(
                      'autoGeneratePayrollItems',
                      e.target.checked
                    )
                  }
                />
                Auto-generate payroll line items from compensation
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border"
                  checked={settingsForm.watch('notificationEmailEnabled')}
                  onChange={(e) =>
                    settingsForm.setValue(
                      'notificationEmailEnabled',
                      e.target.checked
                    )
                  }
                />
                Enable email notifications preference
              </label>
              {settingsQuery.data?.defaultApprovalSequence?.length ? (
                <p className="text-xs text-muted-foreground">
                  Approval sequence:{' '}
                  {settingsQuery.data.defaultApprovalSequence.join(' → ')}
                </p>
              ) : null}
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={settingsForm.formState.isSubmitting}
              >
                {settingsForm.formState.isSubmitting
                  ? 'Saving…'
                  : 'Save payroll rules'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
      ) : null}

      <TabsContent value="security" className="space-y-4">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Change password</CardTitle>
            <CardDescription>
              Update the password for {user?.email ?? 'your account'}.
            </CardDescription>
          </CardHeader>
          <form onSubmit={onSecuritySubmit}>
            <CardContent className="max-w-md space-y-4">
              <PasswordField
                control={securityForm.control}
                name="currentPassword"
                label="Current password"
              />
              <PasswordField
                control={securityForm.control}
                name="newPassword"
                label="New password"
              />
              <PasswordField
                control={securityForm.control}
                name="confirmPassword"
                label="Confirm new password"
              />
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={securityForm.formState.isSubmitting}
              >
                {securityForm.formState.isSubmitting
                  ? 'Updating…'
                  : 'Update password'}
              </Button>
            </CardFooter>
          </form>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Sessions & 2FA</CardTitle>
            <CardDescription>
              Multi-factor authentication and session management will ship with
              enterprise hardening. Active sessions are revoked on logout today.
            </CardDescription>
          </CardHeader>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
