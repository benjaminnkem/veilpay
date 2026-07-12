export type EmployeeStatus = 'active' | 'inactive' | 'onboarding';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  title: string;
  status: EmployeeStatus;
  hireDate: string;
  compensationBand?: string;
}

export interface CreateEmployeePayload {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  title: string;
  hireDate: string;
}

export interface UpdateEmployeePayload extends Partial<CreateEmployeePayload> {
  status?: EmployeeStatus;
}
