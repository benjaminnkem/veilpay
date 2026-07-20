import { publicPost } from '@/lib/api';
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
  const data = await publicPost<ApiLoginResponse, LoginPayload>(
    '/auth/login',
    payload
  );

  return {
    user: mapUser(data.user),
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
  };
}
