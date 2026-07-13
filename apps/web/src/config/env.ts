import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
});

const serverEnvSchema = clientEnvSchema.extend({
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
});

function getClientEnv() {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  });

  if (!parsed.success) {
    throw new Error('Invalid client environment variables');
  }

  return parsed.data;
}

function getServerEnv() {
  const parsed = serverEnvSchema.safeParse({
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
    NEXTAUTH_SECRET:
      process.env.NEXTAUTH_SECRET ?? 'veilpay-dev-secret-change-in-production',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  });

  if (!parsed.success) {
    throw new Error('Invalid server environment variables');
  }

  return parsed.data;
}

export const clientEnv = getClientEnv();
export const serverEnv = typeof window === 'undefined' ? getServerEnv() : null;

export const env = {
  apiUrl: clientEnv.NEXT_PUBLIC_API_URL,
  nextAuthSecret: serverEnv?.NEXTAUTH_SECRET,
  nextAuthUrl: serverEnv?.NEXTAUTH_URL,
} as const;
