'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { InputField } from '@/components/forms';
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
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/features/auth/schemas/forgot-password.schema';
import { forgotPassword } from '@/features/auth/services/forgot-password';
import { useApiMutation } from '@/hooks/useApiMutation';
import { notify } from '@/lib/toast';

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const mutation = useApiMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      setSubmitted(true);
      notify.success('Check your inbox', 'Password reset instructions sent.');
    },
    onError: () => {
      setSubmitted(true);
      notify.success(
        'Check your inbox',
        'If an account exists, reset instructions were sent.',
      );
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
  });

  if (submitted) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Check your email</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          If an account exists for that address, we sent instructions to reset
          your password.
        </CardContent>
        <CardFooter>
          <Button
            nativeButton={false}
            render={<Link href={ROUTES.login} />}
            className="w-full"
          >
            Back to sign in
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Reset your password</CardTitle>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-4">
          <InputField
            control={form.control}
            name="email"
            label="Work email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting || mutation.isPending}
          >
            {mutation.isPending ? 'Sending…' : 'Send reset link'}
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
