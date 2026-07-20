'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { PasswordField } from '@/components/forms';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '@/features/auth/schemas/reset-password.schema';
import { resetPassword } from '@/features/auth/services/reset-password';
import { useApiMutation } from '@/hooks/useApiMutation';
import { notify } from '@/lib/toast';

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      password: '',
      confirmPassword: '',
    },
  });

  const mutation = useApiMutation({
    mutationFn: (values: ResetPasswordFormValues) =>
      resetPassword({
        token: values.token,
        newPassword: values.password,
      }),
    onSuccess: () => {
      notify.success('Password updated', 'You can sign in with your new password.');
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
        <CardTitle className="text-base">Choose a new password</CardTitle>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-4">
          <PasswordField
            control={form.control}
            name="password"
            label="New password"
            autoComplete="new-password"
          />
          <PasswordField
            control={form.control}
            name="confirmPassword"
            label="Confirm password"
            autoComplete="new-password"
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting || mutation.isPending}
          >
            {mutation.isPending ? 'Updating…' : 'Update password'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            <Link
              href={ROUTES.login}
              className="text-foreground underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
