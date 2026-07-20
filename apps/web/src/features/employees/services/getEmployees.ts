import { authGet } from '@/lib/api';
import type { Employee } from '@/features/employees/types';
import type { PaginatedResponse, PaginationParams } from '@/types/api';

export async function getEmployees(
  params?: PaginationParams & { status?: string; department?: string }
): Promise<PaginatedResponse<Employee>> {
  return authGet<PaginatedResponse<Employee>>('/employees', {
    params,
  });
}

export async function getEmployee(id: string): Promise<Employee> {
  return authGet<Employee>(`/employees/${id}`);
}

export async function getDepartments(): Promise<
  Array<{ name: string; employeeCount: number }>
> {
  return authGet('/employees/departments');
}
