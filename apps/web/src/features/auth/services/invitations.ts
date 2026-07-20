import { publicGet, publicPost } from '@/lib/api';
import type { LoginResponse } from '@/types/auth';

export interface InvitationPublicInfo {
  email: string;
  role: string;
  organizationName: string;
  firstName: string | null;
  lastName: string | null;
  expiresAt: string;
  status: string;
}

export interface AcceptInvitationPayload {
  token: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export async function getInvitationByToken(
  token: string
): Promise<InvitationPublicInfo> {
  return publicGet<InvitationPublicInfo>(`/invitations/token/${token}`);
}

export async function acceptInvitation(
  payload: AcceptInvitationPayload
): Promise<LoginResponse> {
  return publicPost<LoginResponse, AcceptInvitationPayload>(
    '/invitations/accept',
    payload
  );
}
