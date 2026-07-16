import { apiPatch } from '@/lib/api';
import type {
  Employee,
  UpdateEmployeePayload,
} from '@/features/employees/types';

export async function updateEmployee(
  id: string,
  payload: UpdateEmployeePayload
): Promise<Employee> {
  const body = {
    ...payload,
    position: payload.position ?? payload.title,
  };
  return apiPatch<Employee, typeof body>(`/employees/${id}`, body);
}
