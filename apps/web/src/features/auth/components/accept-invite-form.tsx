'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
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
import { ROUTES } from '@/constants/routes';
import { clientEnv } from '@/config/env';
import { useApiMutation } from '@/hooks/useApiMutation';
import { notify } from '@/lib/toast';
import axios from 'axios';

const acceptSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type AcceptFormValues = z.infer<typeof acceptSchema>;

export function AcceptInviteForm({ token }: { token: string }) {
  const router = useRouter();

  const preview = useQuery({
    queryKey: ['invitation', token],
    queryFn: async () => {
      const { data } = await axios.get(
        `${clientEnv.NEXT_PUBLIC_API_URL}/invitations/token/${token}`
      );
      return data as {
        email: string;
        role: string;
        organizationName: string;
        firstName: string | null;
        lastName: string | null;
        status: string;
      };
    },
  });

  const form = useForm<AcceptFormValues>({
    resolver: zodResolver(acceptSchema),
    values: {
      firstName: preview.data?.firstName ?? '',
      lastName: preview.data?.lastName ?? '',
      password: '',
      confirmPassword: '',
    },
  });

  const mutation = useApiMutation({
    mutationFn: async (values: AcceptFormValues) => {
      const { data } = await axios.post(
        `${clientEnv.NEXT_PUBLIC_API_URL}/invitations/accept`,
        {
          token,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
        }
      );
      return data;
    },
    onSuccess: () => {
      notify.success('Welcome to VeilPay', 'You can now sign in.');
      router.push(ROUTES.login);
    },
    onError: (error) => notify.error(error),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
  });

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Accept invitation</CardTitle>
        <CardDescription>
          {preview.isLoading
            ? 'Loading invitation…'
            : preview.data
              ? `Join ${preview.data.organizationName} as ${preview.data.role}`
              : 'Invalid or expired invitation'}
        </CardDescription>
      </CardHeader>
      {preview.data ? (
        <form onSubmit={onSubmit} noValidate>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Email: <span className="text-foreground">{preview.data.email}</span>
            </p>
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
            <PasswordField
              control={form.control}
              name="password"
              label="Password"
              autoComplete="new-password"
            />
            <PasswordField
              control={form.control}
              name="confirmPassword"
              label="Confirm password"
              autoComplete="new-password"
            />
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Creating account…' : 'Accept & continue'}
            </Button>
          </CardFooter>
        </form>
      ) : null}
    </Card>
  );
}
