import { authGet } from '@/lib/api';
import type { DashboardStats } from '@repo/types';

export async function getDashboardStats(): Promise<DashboardStats> {
  return authGet<DashboardStats>('/dashboard/stats');
}
