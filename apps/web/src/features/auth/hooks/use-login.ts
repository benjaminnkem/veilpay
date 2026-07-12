'use client';

import { signIn } from 'next-auth/react';

import { useApiMutation } from '@/hooks/useApiMutation';
import type { LoginFormValues } from '@/features/auth/schemas/login.schema';

export function useLogin() {
  return useApiMutation({
    mutationFn: async (values: LoginFormValues) => {
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Invalid email or password');
      }

      return result;
    },
  });
}
