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
import { SettingsSection } from '@/features/settings/components/settings-section';
import { TreasurySettings } from '@/features/settings/components/treasury-settings';
import {
  getOrganization,
  updateOrganization,
} from '@/features/settings/services/updateProfile';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { authGet, authPatch, authPost } from '@/lib/api';
import { canEditOrgSettings, canManageTreasury } from '@/lib/auth/rbac';
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
    <Tabs defaultValue="profile" className="w-full gap-0 space-y-0">
      <div className="border-b border-border/60 pb-4">
        <TabsList
          variant="line"
          className={cn(
            'h-auto w-full max-w-2xl justify-start gap-1 rounded-none bg-transparent p-0',
            tabCount === 2 && 'grid grid-cols-2 sm:inline-flex sm:grid-cols-none',
            tabCount === 3 && 'grid grid-cols-3 sm:inline-flex sm:grid-cols-none',
            tabCount >= 4 && 'grid grid-cols-2 sm:inline-flex sm:grid-cols-none',
          )}
        >
          <TabsTrigger value="profile" className="px-3 py-2">
            Profile
          </TabsTrigger>
          {showOrgTab ? (
            <TabsTrigger value="organization" className="px-3 py-2">
              Organization
            </TabsTrigger>
          ) : null}
          {showPayrollTab ? (
            <TabsTrigger value="payroll" className="px-3 py-2">
              Payroll
            </TabsTrigger>
          ) : null}
          <TabsTrigger value="security" className="px-3 py-2">
            Security
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="profile" className="mt-8 focus-visible:outline-none">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-12">
          <SettingsSection
            step={1}
            title="Profile"
            description="How your identity appears across VeilPay."
          >
            <ProfileSettingsForm />
            <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
              <span className="text-muted-foreground">Role </span>
              <span className="font-medium capitalize">
                {String(user?.role ?? '—')
                  .replaceAll('_', ' ')
                  .toLowerCase()}
              </span>
              {user?.email ? (
                <span className="text-muted-foreground">
                  {' '}
                  · {user.email}
                </span>
              ) : null}
            </div>
          </SettingsSection>

          <SettingsSection
            step={2}
            title="Payout wallet"
            description="Link the wallet where you want to receive payroll. You’ll sign a short message to prove ownership — no funds move."
          >
            <PayoutWalletCard />
          </SettingsSection>

          <SettingsSection
            step={3}
            title="Confidential payout"
            description="After confidential payroll, decrypt your encrypted balance privately or unwrap it to plain USDC."
          >
            <ConfidentialPayoutCard />
          </SettingsSection>
        </div>
      </TabsContent>

      {showOrgTab ? (
        <TabsContent
          value="organization"
          className="mt-8 focus-visible:outline-none"
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-12">
            {canEditOrgSettings(user?.role) ? (
              <SettingsSection
                step={1}
                title="Organization"
                description="Legal identity and payroll defaults for this workspace."
              >
                <Card className="border-border/60 shadow-none">
                  <form onSubmit={onOrgSubmit}>
                    <CardContent className="grid gap-4 pt-(--card-spacing) sm:grid-cols-2">
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
              </SettingsSection>
            ) : null}

            {canManageTreasury(user?.role) ? (
              <TreasurySettings
                startStep={canEditOrgSettings(user?.role) ? 2 : 1}
              />
            ) : null}
          </div>
        </TabsContent>
      ) : null}

      {showPayrollTab ? (
        <TabsContent
          value="payroll"
          className="mt-8 focus-visible:outline-none"
        >
          <div className="mx-auto w-full max-w-3xl">
            <SettingsSection
              step={1}
              title="Payroll rules"
              description="Approval and generation defaults for this workspace."
            >
              <Card className="border-border/60 shadow-none">
                <form onSubmit={onSettingsSubmit}>
                  <CardContent className="space-y-5 pt-(--card-spacing)">
                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="fiscalYearStartMonth"
                      >
                        Fiscal year start month (1–12)
                      </label>
                      <input
                        id="fiscalYearStartMonth"
                        type="number"
                        min={1}
                        max={12}
                        className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        {...settingsForm.register('fiscalYearStartMonth', {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/15 p-4">
                      <label className="flex items-start gap-3 text-sm">
                        <input
                          type="checkbox"
                          className="mt-0.5 size-4 rounded border"
                          {...settingsForm.register('payrollApprovalRequired')}
                        />
                        <span>
                          <span className="font-medium">
                            Require multi-level payroll approval
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            Runs must pass the approval sequence before
                            execution.
                          </span>
                        </span>
                      </label>
                      <label className="flex items-start gap-3 text-sm">
                        <input
                          type="checkbox"
                          className="mt-0.5 size-4 rounded border"
                          {...settingsForm.register(
                            'autoGeneratePayrollItems',
                          )}
                        />
                        <span>
                          <span className="font-medium">
                            Auto-generate payroll line items
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            Build pay lines from active compensation when a run
                            is created.
                          </span>
                        </span>
                      </label>
                      <label className="flex items-start gap-3 text-sm">
                        <input
                          type="checkbox"
                          className="mt-0.5 size-4 rounded border"
                          {...settingsForm.register(
                            'notificationEmailEnabled',
                          )}
                        />
                        <span>
                          <span className="font-medium">
                            Email notifications preference
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            Allow workspace email alerts when available.
                          </span>
                        </span>
                      </label>
                    </div>
                    {settingsQuery.data?.defaultApprovalSequence?.length ? (
                      <p className="text-xs text-muted-foreground">
                        Approval sequence:{' '}
                        {settingsQuery.data.defaultApprovalSequence.join(
                          ' → ',
                        )}
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
            </SettingsSection>
          </div>
        </TabsContent>
      ) : null}

      <TabsContent
        value="security"
        className="mt-8 focus-visible:outline-none"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-12">
          <SettingsSection
            step={1}
            title="Change password"
            description={`Update the password for ${user?.email ?? 'your account'}.`}
          >
            <Card className="border-border/60 shadow-none">
              <form onSubmit={onSecuritySubmit}>
                <CardContent className="max-w-md space-y-4 pt-(--card-spacing)">
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
          </SettingsSection>

          <SettingsSection
            step={2}
            title="Sessions & security"
            description="Session handling and multi-factor options for this account."
          >
            <Card className="border-border/60 shadow-none">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Coming soon
                </CardTitle>
                <CardDescription>
                  Multi-factor authentication and device session management
                  will ship with enterprise hardening. Active sessions are
                  revoked on logout today.
                </CardDescription>
              </CardHeader>
            </Card>
          </SettingsSection>
        </div>
      </TabsContent>
    </Tabs>
  );
}
