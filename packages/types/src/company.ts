export type CompanyStatus = 'active' | 'inactive' | 'suspended';

export interface Company {
  id: string;
  name: string;
  legalName?: string;
  taxId?: string;
  status: CompanyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyInput {
  name: string;
  legalName?: string;
  taxId?: string;
}
