import { publicPost } from '@/lib/api';

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<{ message: string }> {
  return publicPost<{ message: string }, ResetPasswordPayload>(
    '/auth/reset-password',
    payload
  );
}
