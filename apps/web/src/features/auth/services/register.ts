import { apiPost } from '@/lib/api';
import type { RegisterPayload } from '@/features/auth/types';
import type { LoginResponse } from '@/types/auth';

export async function register(
  payload: RegisterPayload
): Promise<LoginResponse> {
  return apiPost<LoginResponse, RegisterPayload>('/auth/register', payload);
}
