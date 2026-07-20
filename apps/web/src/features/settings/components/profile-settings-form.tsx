'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

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
import {
  profileSchema,
  type ProfileFormValues,
} from '@/features/settings/schemas/profile.schema';
import { updateProfile } from '@/features/settings/services/updateProfile';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { notify } from '@/lib/toast';

export function ProfileSettingsForm() {
  const { user } = useCurrentUser();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      organizationName: user?.organizationName ?? '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const parts = values.name.trim().split(/\s+/);
    const firstName = parts[0] ?? values.name;
    const lastName = parts.slice(1).join(' ') || firstName;

    try {
      await updateProfile({ firstName, lastName });
      notify.success('Profile updated');
    } catch (error) {
      notify.error(error);
    }
  });

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Profile</CardTitle>
        <CardDescription>
          Manage how your identity appears across VeilPay.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-4">
          <InputField
            control={form.control}
            name="name"
            label="Full name"
            autoComplete="name"
          />
          <InputField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            disabled
          />
          <InputField
            control={form.control}
            name="organizationName"
            label="Organization"
            disabled
          />
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
