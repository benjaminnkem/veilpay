import { apiPatch } from '@/lib/api';
import type {
  Employee,
  UpdateEmployeePayload,
} from '@/features/employees/types';

export async function updateEmployee(
  id: string,
  payload: UpdateEmployeePayload
): Promise<Employee> {
  return apiPatch<Employee, UpdateEmployeePayload>(
    `/employees/${id}`,
    payload
  );
}
