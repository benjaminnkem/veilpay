import { authGet, authPatch } from '@/lib/api';

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  walletAddress?: string | null;
}

export async function updateProfile(payload: UpdateProfilePayload) {
  return authPatch('/users/me', payload);
}

export async function getOrganization() {
  return authGet<{
    id: string;
    name: string;
    legalName: string | null;
    currency: string;
    timezone: string;
    safeAddress: string | null;
    network: string | null;
    executionProvider?: string;
  }>('/organizations/me');
}

export async function updateOrganization(payload: {
  name?: string;
  legalName?: string | null;
  safeAddress?: string | null;
  network?: string | null;
  executionProvider?: string | null;
  currency?: string;
  timezone?: string;
}) {
  return authPatch('/organizations/me', payload);
}
