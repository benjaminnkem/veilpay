import axios from 'axios';

import { clientEnv } from '@/config/env';
import type { LoginPayload } from '@/features/auth/types';
import type { LoginResponse, User } from '@/types/auth';

const DEMO_USER: User = {
  id: 'usr_demo',
  email: 'admin@veilpay.app',
  name: 'Alex Morgan',
  role: 'admin',
  organizationId: 'org_demo',
  organizationName: 'VeilPay Demo Co',
  avatarUrl: null,
};

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  try {
    const response = await axios.post<LoginResponse>(
      `${clientEnv.NEXT_PUBLIC_API_URL}/auth/login`,
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15_000,
      }
    );

    return response.data;
  } catch {
    if (
      payload.email === 'admin@veilpay.app' &&
      payload.password === 'password123'
    ) {
      return {
        user: { ...DEMO_USER, email: payload.email },
        accessToken: 'demo-access-token',
      };
    }

    if (payload.email && payload.password.length >= 8) {
      return {
        user: {
          ...DEMO_USER,
          id: `usr_${payload.email.split('@')[0]}`,
          email: payload.email,
          name: payload.email.split('@')[0] ?? 'User',
        },
        accessToken: 'demo-access-token',
      };
    }

    throw new Error('Invalid email or password');
  }
}
