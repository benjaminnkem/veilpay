import { publicPost } from '@/lib/api';
import type { ForgotPasswordPayload } from '@/features/auth/types';

export async function forgotPassword(
  payload: ForgotPasswordPayload
): Promise<{ message: string }> {
  return publicPost<{ message: string }, ForgotPasswordPayload>(
    '/auth/forgot-password',
    payload
  );
}
