'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { InputField } from '@/components/forms';
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
import { ProfileSettingsForm } from '@/features/settings/components/profile-settings-form';
import {
  getOrganization,
  updateOrganization,
} from '@/features/settings/services/updateProfile';
import { authGet, authPatch } from '@/lib/api';
import { notify } from '@/lib/toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const orgSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  legalName: z.string().optional(),
  currency: z.string().min(1),
  timezone: z.string().min(1),
  safeAddress: z.string().optional(),
  network: z.string().optional(),
});

type OrgFormValues = z.infer<typeof orgSchema>;

const settingsSchema = z.object({
  fiscalYearStartMonth: z.number().min(1).max(12),
  payrollApprovalRequired: z.boolean(),
  autoGeneratePayrollItems: z.boolean(),
  notificationEmailEnabled: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsWorkspace() {
  const { user } = useCurrentUser();

  const orgQuery = useQuery({
    queryKey: ['organization', 'me'],
    queryFn: getOrganization,
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
  });

  const orgForm = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    values: {
      name: orgQuery.data?.name ?? '',
      legalName: orgQuery.data?.legalName ?? '',
      currency: orgQuery.data?.currency ?? 'USD',
      timezone: orgQuery.data?.timezone ?? 'UTC',
      safeAddress: orgQuery.data?.safeAddress ?? '',
      network: orgQuery.data?.network ?? '',
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

  const onOrgSubmit = orgForm.handleSubmit(async (values) => {
    try {
      await updateOrganization({
        name: values.name,
        legalName: values.legalName || null,
        currency: values.currency,
        timezone: values.timezone,
        safeAddress: values.safeAddress || null,
        network: values.network || null,
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

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList className="grid w-full max-w-xl grid-cols-3">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="organization">Organization</TabsTrigger>
        <TabsTrigger value="payroll">Payroll rules</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-4">
        <ProfileSettingsForm />
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Access</CardTitle>
            <CardDescription>
              Role{' '}
              <span className="font-medium capitalize text-foreground">
                {String(user?.role ?? '—').replaceAll('_', ' ').toLowerCase()}
              </span>
            </CardDescription>
          </CardHeader>
        </Card>
      </TabsContent>

      <TabsContent value="organization">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Organization</CardTitle>
            <CardDescription>
              Legal identity and future treasury placeholders.
            </CardDescription>
          </CardHeader>
          <form onSubmit={onOrgSubmit}>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InputField control={orgForm.control} name="name" label="Name" />
              <InputField
                control={orgForm.control}
                name="legalName"
                label="Legal name"
              />
              <InputField
                control={orgForm.control}
                name="currency"
                label="Currency"
              />
              <InputField
                control={orgForm.control}
                name="timezone"
                label="Timezone"
              />
              <InputField
                control={orgForm.control}
                name="safeAddress"
                label="Safe address"
              />
              <InputField
                control={orgForm.control}
                name="network"
                label="Network"
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={orgForm.formState.isSubmitting}>
                {orgForm.formState.isSubmitting ? 'Saving…' : 'Save organization'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>

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
                <label className="text-sm font-medium" htmlFor="fiscalYearStartMonth">
                  Fiscal year start month (1–12)
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
    </Tabs>
  );
}
