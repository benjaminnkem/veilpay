import type { CompensationFrequency, CompensationType } from './enums.js';
import type { Timestamps } from './common.js';

export interface Compensation extends Timestamps {
  id: string;
  employeeId: string;
  organizationId: string;
  type: CompensationType;
  amountCents: number;
  currency: string;
  frequency: CompensationFrequency;
  effectiveDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
}

export interface CreateCompensationInput {
  employeeId: string;
  type: CompensationType;
  amountCents: number;
  currency?: string;
  frequency: CompensationFrequency;
  effectiveDate: string;
  endDate?: string;
  description?: string;
}

export interface EndCompensationInput {
  endDate: string;
}
