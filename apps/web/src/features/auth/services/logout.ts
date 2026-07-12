import { apiPost } from '@/lib/api';

export async function logout(): Promise<void> {
  try {
    await apiPost('/auth/logout');
  } catch {
    return;
  }
}
