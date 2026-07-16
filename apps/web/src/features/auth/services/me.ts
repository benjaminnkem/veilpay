import { authGet } from '@/lib/api';
import type { User } from '@/types/auth';

export async function getMe(): Promise<User> {
  return authGet<User>('/auth/me');
}
