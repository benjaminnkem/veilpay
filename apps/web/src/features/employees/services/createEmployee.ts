import { authPost } from '@/lib/api';
import type {
  CreateEmployeePayload,
  Employee,
} from '@/features/employees/types';

export async function createEmployee(
  payload: CreateEmployeePayload
): Promise<Employee> {
  const body = {
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    department: payload.department,
    position: payload.position ?? payload.title,
    hireDate: payload.hireDate,
    walletAddress: payload.walletAddress,
    phone: payload.phone,
    country: payload.country,
    notes: payload.notes,
    employeeNumber: payload.employeeNumber,
    status: payload.status,
  };

  return authPost<Employee, typeof body>('/employees', body);
}
