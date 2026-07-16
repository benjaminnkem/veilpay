import type { EmploymentStatus } from '@repo/types';

export type EmployeeStatus = EmploymentStatus | string;

export interface Employee {
  id: string;
  organizationId?: string;
  userId?: string | null;
  employeeNumber?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  department: string | null;
  position: string | null;
  /** Alias for position from API */
  title?: string | null;
  status: EmployeeStatus;
  hireDate: string | null;
  terminationDate?: string | null;
  walletAddress?: string | null;
  managerId?: string | null;
  phone?: string | null;
  country?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmployeePayload {
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  position?: string;
  title?: string;
  hireDate?: string;
  walletAddress?: string;
  phone?: string;
  country?: string;
  notes?: string;
  employeeNumber?: string;
  status?: EmployeeStatus;
}

export interface UpdateEmployeePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: string | null;
  position?: string | null;
  title?: string | null;
  hireDate?: string | null;
  status?: EmployeeStatus;
  terminationDate?: string | null;
  walletAddress?: string | null;
  phone?: string | null;
  country?: string | null;
  notes?: string | null;
  employeeNumber?: string | null;
}
