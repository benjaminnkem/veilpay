import { apiPost } from '@/lib/api';
import type {
  CreateEmployeePayload,
  Employee,
} from '@/features/employees/types';

export async function createEmployee(
  payload: CreateEmployeePayload
): Promise<Employee> {
  return apiPost<Employee, CreateEmployeePayload>('/employees', payload);
}
