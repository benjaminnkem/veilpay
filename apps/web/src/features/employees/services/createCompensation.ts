import { authPost } from '@/lib/api';

export interface CreateCompensationPayload {
  employeeId: string;
  type: string;
  amount: number;
  currency: string;
  frequency: string;
  effectiveDate: string;
  description?: string;
}

export interface Compensation {
  id: string;
  employeeId: string;
  organizationId: string;
  type: string;
  amountCents: number;
  currency: string;
  frequency: string;
  effectiveDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function createCompensation(
  payload: CreateCompensationPayload
): Promise<Compensation> {
  const amountCents = Math.round(payload.amount * 100);
  const body = {
    employeeId: payload.employeeId,
    type: payload.type,
    amountCents,
    currency: payload.currency,
    frequency: payload.frequency,
    effectiveDate: payload.effectiveDate,
    description: payload.description || undefined,
  };

  return authPost<Compensation, typeof body>('/compensation', body);
}
