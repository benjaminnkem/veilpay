export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';

export interface Employee {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  walletAddress?: string;
  status: EmployeeStatus;
  salaryCents: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeInput {
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  walletAddress?: string;
  salaryCents: number;
  currency?: string;
}
