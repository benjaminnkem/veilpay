import axios from 'axios';

import { clientEnv } from '@/config/env';
import type { LoginPayload } from '@/features/auth/types';
import type { LoginResponse, User } from '@/types/auth';

interface ApiAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  role: string;
  organizationId: string | null;
  organizationName: string | null;
  avatarUrl: string | null;
  walletAddress?: string | null;
  isActive?: boolean;
}

interface ApiLoginResponse {
  user: ApiAuthUser;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

function mapUser(user: ApiAuthUser): User {
  return {
    id: user.id,
    email: user.email,
    name:
      user.name ??
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ??
      user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    organizationId: user.organizationId ?? undefined,
    organizationName: user.organizationName ?? undefined,
    avatarUrl: user.avatarUrl,
    walletAddress: user.walletAddress,
    isActive: user.isActive,
  };
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await axios.post<ApiLoginResponse>(
    `${clientEnv.NEXT_PUBLIC_API_URL}/auth/login`,
    payload,
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15_000,
    }
  );

  return {
    user: mapUser(response.data.user),
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
    expiresIn: response.data.expiresIn,
  };
}
