import { apiDelete } from '@/lib/api';

export async function deleteEmployee(id: string): Promise<void> {
  await apiDelete(`/employees/${id}`);
}
