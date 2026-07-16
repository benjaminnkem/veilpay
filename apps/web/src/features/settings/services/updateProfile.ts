import { apiPatch } from '@/lib/api';

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  walletAddress?: string | null;
}

export async function updateProfile(payload: UpdateProfilePayload) {
  return apiPatch('/users/me', payload);
}

export async function getOrganization() {
  return apiGetOrganization();
}

async function apiGetOrganization() {
  const { apiGet } = await import('@/lib/api');
  return apiGet<{
    id: string;
    name: string;
    legalName: string | null;
    currency: string;
    timezone: string;
    safeAddress: string | null;
    network: string | null;
  }>('/organizations/me');
}

export async function updateOrganization(payload: {
  name?: string;
  legalName?: string | null;
  safeAddress?: string | null;
  network?: string | null;
  currency?: string;
  timezone?: string;
}) {
  const { apiPatch } = await import('@/lib/api');
  return apiPatch('/organizations/me', payload);
}
