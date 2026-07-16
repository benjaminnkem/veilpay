import { publicPost } from '@/lib/api';
import type { RegisterPayload } from '@/features/auth/types';
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
}

interface ApiAuthResponse {
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
  };
}

export async function register(
  payload: RegisterPayload
): Promise<LoginResponse> {
  const body = {
    email: payload.email,
    password: payload.password,
    firstName: payload.firstName ?? payload.name?.split(' ')[0] ?? 'Owner',
    lastName:
      payload.lastName ??
      payload.name?.split(' ').slice(1).join(' ') ??
      'User',
    organizationName:
      payload.organizationName ?? payload.companyName ?? 'My Organization',
  };

  const data = await publicPost<ApiAuthResponse, typeof body>(
    '/auth/register',
    body
  );

  return {
    user: mapUser(data.user),
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
  };
}
