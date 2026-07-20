'use client';

import { useQueryClient } from '@tanstack/react-query';

import {
  createInvitation,
  getInvitations,
  revokeInvitation,
  type CreateInvitationPayload,
} from '@/features/invitations/services/invitations';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useApiQuery } from '@/hooks/useApiQuery';

export const invitationsQueryKey = ['invitations'] as const;

export function useInvitations() {
  return useApiQuery({
    queryKey: invitationsQueryKey,
    queryFn: () => getInvitations({ pageSize: 50 }),
  });
}

export function useCreateInvitation() {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: (payload: CreateInvitationPayload) => createInvitation(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: invitationsQueryKey });
    },
  });
}

export function useRevokeInvitation() {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: (id: string) => revokeInvitation(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: invitationsQueryKey });
    },
  });
}
