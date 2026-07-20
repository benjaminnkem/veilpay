import { authGet, authPost, authPatch } from '@/lib/api';
import type {
  CreatePayrollPayload,
  PayrollRun,
} from '@/features/payroll/types';
import type { PaginatedResponse, PaginationParams } from '@/types/api';

export async function getPayrollRuns(
  params?: PaginationParams & { status?: string }
): Promise<PayrollRun[]> {
  const result = await authGet<PaginatedResponse<PayrollRun>>('/payroll', {
    params,
  });
  return result.data;
}

export async function getPayroll(id: string): Promise<PayrollRun> {
  return authGet<PayrollRun>(`/payroll/${id}`);
}

export async function createPayroll(
  payload: CreatePayrollPayload
): Promise<PayrollRun> {
  return authPost<PayrollRun, CreatePayrollPayload>('/payroll', payload);
}

export async function submitPayroll(id: string): Promise<PayrollRun> {
  return authPost<PayrollRun>(`/payroll/${id}/submit`);
}

export async function executePayroll(id: string): Promise<PayrollRun> {
  return authPost<PayrollRun>(`/payroll/${id}/execute`, undefined, {
    timeout: 180_000,
  });
}

export async function cancelPayroll(id: string): Promise<PayrollRun> {
  return authPost<PayrollRun>(`/payroll/${id}/cancel`);
}

export async function regeneratePayroll(id: string): Promise<PayrollRun> {
  return authPost<PayrollRun>(`/payroll/${id}/regenerate`, {});
}

export async function updatePayroll(
  id: string,
  payload: Partial<CreatePayrollPayload>
): Promise<PayrollRun> {
  return authPatch<PayrollRun, typeof payload>(`/payroll/${id}`, payload);
}
