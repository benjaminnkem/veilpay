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
/**
 * Create a new compensation line. History is append-only:
 * creating a new current line of the same type ends the previous one.
 * There is no update-in-place API for amounts or terms.
 */
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
//# sourceMappingURL=compensation.d.ts.map