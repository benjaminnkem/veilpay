import { authDelete, authGet, authPost } from '@/lib/api';
import type { PaginatedResponse, PaginationParams } from '@/types/api';

export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  type: string;
  status: string;
  invitedById: string;
  expiresAt: string;
  acceptedAt: string | null;
  firstName: string | null;
  lastName: string | null;
  department: string | null;
  position: string | null;
  startingSalaryCents: number | null;
  salaryCurrency: string | null;
  salaryFrequency: string | null;
  token?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvitationPayload {
  email: string;
  role: string;
  type?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  position?: string;
  startingSalary?: number;
  salaryCurrency?: string;
  salaryFrequency?: string;
  expiresInDays?: number;
}

export async function getInvitations(
  params?: PaginationParams
): Promise<PaginatedResponse<Invitation>> {
  return authGet('/invitations', { params });
}

export async function createInvitation(
  payload: CreateInvitationPayload
): Promise<Invitation> {
  return authPost('/invitations', payload);
}

export async function revokeInvitation(id: string): Promise<Invitation> {
  return authDelete(`/invitations/${id}`);
}
