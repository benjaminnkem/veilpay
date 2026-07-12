import { apiGet } from '@/lib/api';
import type { PayrollRun } from '@/features/payroll/types';

const DEMO_RUNS: PayrollRun[] = [
  {
    id: 'pay_1',
    periodLabel: 'March 2026',
    status: 'pending_approval',
    employeeCount: 128,
    totalAmount: 942_500,
    currency: 'USD',
    scheduledAt: '2026-03-28T00:00:00.000Z',
    confidential: true,
  },
  {
    id: 'pay_2',
    periodLabel: 'February 2026',
    status: 'completed',
    employeeCount: 126,
    totalAmount: 918_200,
    currency: 'USD',
    scheduledAt: '2026-02-27T00:00:00.000Z',
    confidential: true,
  },
  {
    id: 'pay_3',
    periodLabel: 'January 2026',
    status: 'completed',
    employeeCount: 124,
    totalAmount: 901_050,
    currency: 'USD',
    scheduledAt: '2026-01-30T00:00:00.000Z',
    confidential: true,
  },
];

export async function getPayrollRuns(): Promise<PayrollRun[]> {
  try {
    return await apiGet<PayrollRun[]>('/payroll/runs');
  } catch {
    return DEMO_RUNS;
  }
}
