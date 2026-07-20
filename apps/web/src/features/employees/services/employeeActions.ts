import { authPost } from '@/lib/api';
import type { Employee } from '@/features/employees/types';

export async function suspendEmployee(id: string): Promise<Employee> {
  return authPost<Employee>(`/employees/${id}/suspend`);
}

export async function reactivateEmployee(id: string): Promise<Employee> {
  return authPost<Employee>(`/employees/${id}/reactivate`);
}
