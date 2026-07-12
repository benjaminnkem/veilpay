'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { InputField, PasswordField } from '@/components/forms';
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
  registerSchema,
  type RegisterFormValues,
} from '@/features/auth/schemas/register.schema';
import { register } from '@/features/auth/services/register';
import { useApiMutation } from '@/hooks/useApiMutation';
import { notify } from '@/lib/toast';

export function RegisterForm() {
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      organizationName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const mutation = useApiMutation({
    mutationFn: register,
    onSuccess: () => {
      notify.success('Account created', 'You can now sign in to VeilPay.');
      router.push(ROUTES.login);
    },
    onError: (error) => {
      notify.error(error);
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync({
      name: values.name,
      email: values.email,
      organizationName: values.organizationName,
      password: values.password,
    });
  });

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Create your organization</CardTitle>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-4">
          <InputField
            control={form.control}
            name="name"
            label="Full name"
            autoComplete="name"
            placeholder="Alex Morgan"
          />
          <InputField
            control={form.control}
            name="email"
            label="Work email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
          />
          <InputField
            control={form.control}
            name="organizationName"
            label="Organization"
            placeholder="Acme Inc."
          />
          <PasswordField
            control={form.control}
            name="password"
            label="Password"
            autoComplete="new-password"
            placeholder="••••••••"
          />
          <PasswordField
            control={form.control}
            name="confirmPassword"
            label="Confirm password"
            autoComplete="new-password"
            placeholder="••••••••"
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting || mutation.isPending}
          >
            {mutation.isPending ? 'Creating account…' : 'Create account'}
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
