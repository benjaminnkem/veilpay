import { Injectable } from '@nestjs/common';
import type { PayrollStatus } from '@prisma/client';
import { ApiError } from '../common/api-error';
const transitions: Record<PayrollStatus, PayrollStatus[]> = {
  DRAFT: ['PREPARING', 'CANCELLED'],
  PREPARING: ['PREPARED', 'FAILED_RETRYABLE', 'FAILED_FINAL'],
  PREPARED: ['PROPOSING', 'CANCELLED', 'EXPIRED'],
  PROPOSING: ['PROPOSED', 'FAILED_RETRYABLE', 'FAILED_FINAL'],
  PROPOSED: ['SAFE_APPROVED', 'SAFE_REJECTED', 'CANCELLED', 'EXPIRED'],
  SAFE_APPROVED: ['EXECUTING', 'CANCELLED', 'EXPIRED'],
  EXECUTING: ['EXECUTED', 'FAILED_RETRYABLE', 'FAILED_FINAL'],
  EXECUTED: [],
  CANCELLED: [],
  EXPIRED: [],
  SAFE_REJECTED: [],
  FAILED_RETRYABLE: ['PREPARING', 'PROPOSING', 'EXECUTING', 'CANCELLED'],
  FAILED_FINAL: [],
};
@Injectable()
export class PayrollStateService {
  can(from: PayrollStatus, to: PayrollStatus) {
    return transitions[from].includes(to);
  }
  assert(from: PayrollStatus, to: PayrollStatus) {
    if (!this.can(from, to))
      throw new ApiError(
        'PAYROLL_INVALID_STATE',
        `Cannot transition payroll from ${from} to ${to}`,
      );
  }
}
