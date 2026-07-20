'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { ComboboxField, InputField, SelectField } from '@/components/forms';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DEPARTMENT_OPTIONS,
  ROLE_OPTIONS,
} from '@/features/employees/constants/options';
import { useCreateInvitation } from '@/features/invitations/hooks/use-invitations';
import {
  createInvitationSchema,
  type CreateInvitationFormValues,
} from '@/features/invitations/schemas/create-invitation.schema';
import { notify } from '@/lib/toast';

const INVITE_ROLES = [
  { label: 'Owner', value: 'OWNER' },
  { label: 'HR', value: 'HR' },
  { label: 'Finance', value: 'FINANCE' },
  { label: 'CEO', value: 'CEO' },
  { label: 'Auditor', value: 'AUDITOR' },
  { label: 'Employee', value: 'EMPLOYEE' },
];

const FREQUENCY_OPTIONS = [
  { label: 'Annually', value: 'ANNUALLY' },
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Semi-monthly', value: 'SEMIMONTHLY' },
  { label: 'Biweekly', value: 'BIWEEKLY' },
  { label: 'Weekly', value: 'WEEKLY' },
  { label: 'Hourly', value: 'HOURLY' },
];

const CURRENCY_OPTIONS = [
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'GBP', value: 'GBP' },
  { label: 'NGN', value: 'NGN' },
];

export function CreateInvitationDialog() {
  const [open, setOpen] = useState(false);
  const create = useCreateInvitation();

  const form = useForm<CreateInvitationFormValues>({
    resolver: zodResolver(createInvitationSchema),
    defaultValues: {
      email: '',
      role: 'EMPLOYEE',
      type: 'EMPLOYEE',
      firstName: '',
      lastName: '',
      department: '',
      position: '',
      startingSalary: undefined,
      salaryCurrency: 'USD',
      salaryFrequency: 'ANNUALLY',
    },
  });

  const inviteType = form.watch('type');

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await create.mutateAsync({
        email: values.email,
        role: values.role,
        type: values.type,
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
        department: values.department || undefined,
        position: values.position || undefined,
        startingSalary:
          values.startingSalary != null ? values.startingSalary : undefined,
        salaryCurrency: values.salaryCurrency || 'USD',
        salaryFrequency: values.salaryFrequency || 'ANNUALLY',
      });
      notify.success(
        'Invitation sent',
        result.token
          ? 'Email dispatched with starting compensation when set.'
          : 'Email dispatched to the invitee.'
      );
      form.reset({
        email: '',
        role: 'EMPLOYEE',
        type: 'EMPLOYEE',
        firstName: '',
        lastName: '',
        department: '',
        position: '',
        startingSalary: undefined,
        salaryCurrency: 'USD',
        salaryFrequency: 'ANNUALLY',
      });
      setOpen(false);
    } catch (error) {
      notify.error(error);
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" />}>
        Invite member
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Invite teammate</DialogTitle>
          <DialogDescription>
            Set access role and starting salary. Compensation is applied when
            the invite is accepted.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <InputField
            control={form.control}
            name="email"
            label="Email"
            type="email"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              control={form.control}
              name="role"
              label="Access role"
              options={INVITE_ROLES}
            />
            <SelectField
              control={form.control}
              name="type"
              label="Invite type"
              options={[
                { label: 'Employee record', value: 'EMPLOYEE' },
                { label: 'User access only', value: 'USER' },
              ]}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              control={form.control}
              name="firstName"
              label="First name"
            />
            <InputField
              control={form.control}
              name="lastName"
              label="Last name"
            />
          </div>

          {inviteType === 'EMPLOYEE' || inviteType === 'USER' ? (
            <div className="space-y-4 rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-sm font-medium">
                Starting compensation
                {inviteType === 'EMPLOYEE' ? (
                  <span className="text-destructive"> *</span>
                ) : (
                  <span className="font-normal text-muted-foreground">
                    {' '}
                    (optional)
                  </span>
                )}
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className="mb-2 block text-sm font-medium">
                    Amount
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="85000"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    value={
                      form.watch('startingSalary') === undefined
                        ? ''
                        : form.watch('startingSalary')
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      form.setValue(
                        'startingSalary',
                        value === '' ? undefined : Number(value),
                        { shouldValidate: true }
                      );
                    }}
                  />
                  {form.formState.errors.startingSalary ? (
                    <p className="mt-1 text-xs text-destructive">
                      {form.formState.errors.startingSalary.message}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Enter full amount (e.g. 85000)
                    </p>
                  )}
                </div>
                <SelectField
                  control={form.control}
                  name="salaryCurrency"
                  label="Currency"
                  options={CURRENCY_OPTIONS}
                />
                <SelectField
                  control={form.control}
                  name="salaryFrequency"
                  label="Frequency"
                  options={FREQUENCY_OPTIONS}
                />
              </div>
            </div>
          ) : null}

          {inviteType === 'EMPLOYEE' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <ComboboxField
                control={form.control}
                name="department"
                label="Department"
                options={DEPARTMENT_OPTIONS}
                placeholder="Select department"
              />
              <ComboboxField
                control={form.control}
                name="position"
                label="Role / title"
                options={ROLE_OPTIONS}
                placeholder="Select role"
              />
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Sending…' : 'Send invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
