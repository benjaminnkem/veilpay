import { apiGet } from '@/lib/api';
import type { Employee } from '@/features/employees/types';
import type { PaginatedResponse, PaginationParams } from '@/types/api';

const DEMO_EMPLOYEES: Employee[] = [
  {
    id: 'emp_1',
    firstName: 'Jordan',
    lastName: 'Lee',
    email: 'jordan.lee@veilpay.app',
    department: 'Engineering',
    title: 'Staff Engineer',
    status: 'active',
    hireDate: '2023-04-12',
    compensationBand: 'L5',
  },
  {
    id: 'emp_2',
    firstName: 'Sam',
    lastName: 'Okoye',
    email: 'sam.okoye@veilpay.app',
    department: 'Finance',
    title: 'Controller',
    status: 'active',
    hireDate: '2022-11-03',
    compensationBand: 'L4',
  },
  {
    id: 'emp_3',
    firstName: 'Riley',
    lastName: 'Chen',
    email: 'riley.chen@veilpay.app',
    department: 'People',
    title: 'HR Business Partner',
    status: 'onboarding',
    hireDate: '2026-03-01',
    compensationBand: 'L3',
  },
];

export async function getEmployees(
  params?: PaginationParams
): Promise<PaginatedResponse<Employee>> {
  try {
    return await apiGet<PaginatedResponse<Employee>>('/employees', {
      params,
    });
  } catch {
    return {
      data: DEMO_EMPLOYEES,
      meta: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
        total: DEMO_EMPLOYEES.length,
        totalPages: 1,
      },
    };
  }
}
