import type { EmploymentStatus } from './enums.js';
import type { Timestamps, PaginationQuery } from './common.js';
export interface Employee extends Timestamps {
    id: string;
    organizationId: string;
    userId: string | null;
    employeeNumber: string | null;
    firstName: string;
    lastName: string;
    email: string;
    department: string | null;
    position: string | null;
    status: EmploymentStatus;
    hireDate: string | null;
    terminationDate: string | null;
    walletAddress: string | null;
    managerId: string | null;
    phone: string | null;
    country: string | null;
    notes: string | null;
}
export interface CreateEmployeeInput {
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
    position?: string;
    status?: EmploymentStatus;
    hireDate?: string;
    walletAddress?: string;
    managerId?: string;
    phone?: string;
    country?: string;
    notes?: string;
    employeeNumber?: string;
}
export interface UpdateEmployeeInput {
    firstName?: string;
    lastName?: string;
    email?: string;
    department?: string | null;
    position?: string | null;
    status?: EmploymentStatus;
    hireDate?: string | null;
    terminationDate?: string | null;
    walletAddress?: string | null;
    managerId?: string | null;
    phone?: string | null;
    country?: string | null;
    notes?: string | null;
    employeeNumber?: string | null;
}
export interface EmployeeListQuery extends PaginationQuery {
    status?: EmploymentStatus;
    department?: string;
}
export interface DepartmentSummary {
    name: string;
    employeeCount: number;
}
//# sourceMappingURL=employee.d.ts.map