import { authDelete } from '@/lib/api';

export async function deleteEmployee(id: string): Promise<void> {
  await authDelete(`/employees/${id}`);
}
