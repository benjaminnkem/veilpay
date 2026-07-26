'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
  Building2Icon,
  MailIcon,
  ShieldAlertIcon,
  UserRoundIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { InputField, PasswordField } from '@/components/forms';
import { ErrorState, LoadingState } from '@/components/shared';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import {
  acceptInvitation,
  getInvitationByToken,
} from '@/features/auth/services/invitations';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getErrorMessage } from '@/lib/errors';
import { notify } from '@/lib/toast';
import { formatDate } from '@/lib/utils';

const acceptSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type AcceptFormValues = z.infer<typeof acceptSchema>;

function formatRole(role: string) {
  return role
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function AcceptInviteForm({ token }: { token: string }) {
  const router = useRouter();

  const preview = useQuery({
    queryKey: ['invitation', token],
    queryFn: () => getInvitationByToken(token),
    retry: false,
  });

  const form = useForm<AcceptFormValues>({
    resolver: zodResolver(acceptSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!preview.data) return;
    form.reset({
      firstName: preview.data.firstName ?? '',
      lastName: preview.data.lastName ?? '',
      password: '',
      confirmPassword: '',
    });
  }, [preview.data, form]);

  const mutation = useApiMutation({
    mutationFn: (values: AcceptFormValues) =>
      acceptInvitation({
        token,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
      }),
    onSuccess: () => {
      notify.success('Welcome to VeilPay', 'You can now sign in.');
      router.push(ROUTES.login);
    },
    onError: (error) => notify.error(error),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
  });

  if (preview.isLoading) {
    return (
      <Card className="border-border/60">
        <CardHeader className="space-y-2">
          <Skeleton className="mx-auto h-5 w-40" />
          <Skeleton className="mx-auto h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full rounded-lg" />
          <LoadingState variant="form" rows={4} />
        </CardContent>
      </Card>
    );
  }

  if (preview.isError || !preview.data) {
    return (
      <Card className="border-border/60">
        <CardHeader className="text-center">
          <CardTitle className="text-base">Invitation unavailable</CardTitle>
          <CardDescription>
            This link may be invalid, expired, or already used.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ErrorState
            title="Could not open invitation"
            message={
              preview.error
                ? getErrorMessage(preview.error)
                : 'Ask your admin to send a new invite.'
            }
            onRetry={() => void preview.refetch()}
          />
          <Alert>
            <ShieldAlertIcon />
            <AlertTitle>Need access?</AlertTitle>
            <AlertDescription>
              Contact your organization admin, or sign in if you already have an
              account.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            type="button"
            className="w-full"
            nativeButton={false}
            render={<Link href={ROUTES.login} />}
          >
            Go to sign in
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            nativeButton={false}
            render={<Link href={ROUTES.home} />}
          >
            Back to home
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const invite = preview.data;
  const isExpired =
    invite.status === 'EXPIRED' ||
    invite.status === 'REVOKED' ||
    invite.status === 'ACCEPTED' ||
    invite.status === 'CANCELLED';

  if (isExpired) {
    return (
      <Card className="border-border/60">
        <CardHeader className="text-center">
          <CardTitle className="text-base">Invitation not active</CardTitle>
          <CardDescription>
            This invitation can no longer be accepted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <ShieldAlertIcon />
            <AlertTitle className="capitalize">
              {invite.status === 'ACCEPTED'
                ? 'Already accepted'
                : invite.status === 'REVOKED'
                  ? 'Revoked'
                  : 'Expired'}
            </AlertTitle>
            <AlertDescription>
              {invite.status === 'ACCEPTED'
                ? 'This invite was already used. Sign in with your account instead.'
                : 'Ask your admin to send a fresh invitation to your email.'}
              {invite.expiresAt ? (
                <span className="mt-1 block text-xs">
                  Expiry: {formatDate(invite.expiresAt)}
                </span>
              ) : null}
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button
            type="button"
            className="w-full"
            nativeButton={false}
            render={<Link href={ROUTES.login} />}
          >
            Go to sign in
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Set up your account</CardTitle>
        <CardDescription>
          Confirm your details and choose a secure password.
        </CardDescription>
      </CardHeader>

      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-5">
          <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Invitation
              </p>
              <Badge variant="secondary" className="capitalize">
                {formatRole(invite.role)}
              </Badge>
            </div>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li className="flex items-start gap-2.5">
                <Building2Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Organization</p>
                  <p className="font-medium break-words">
                    {invite.organizationName}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <MailIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium break-all">{invite.email}</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <UserRoundIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="font-medium capitalize">
                    {formatRole(invite.role)}
                  </p>
                </div>
              </li>
            </ul>
            {invite.expiresAt ? (
              <p className="mt-3 text-[11px] text-muted-foreground">
                Expires {formatDate(invite.expiresAt)}
              </p>
            ) : null}
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              control={form.control}
              name="firstName"
              label="First name"
              autoComplete="given-name"
              placeholder="Alex"
            />
            <InputField
              control={form.control}
              name="lastName"
              label="Last name"
              autoComplete="family-name"
              placeholder="Morgan"
            />
          </div>

          <PasswordField
            control={form.control}
            name="password"
            label="Password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            description="Use at least 8 characters. You’ll use this to sign in."
          />
          <PasswordField
            control={form.control}
            name="confirmPassword"
            label="Confirm password"
            autoComplete="new-password"
            placeholder="Re-enter password"
          />
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-1">
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting || mutation.isPending}
          >
            {mutation.isPending ? 'Creating account…' : 'Accept & continue'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link
              href={ROUTES.login}
              className="text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
