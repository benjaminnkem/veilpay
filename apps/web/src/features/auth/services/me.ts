import { apiGet } from '@/lib/api';
import type { User } from '@/types/auth';

export async function getMe(): Promise<User> {
  return apiGet<User>('/auth/me');
}
