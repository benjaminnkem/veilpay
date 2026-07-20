import type { OrganizationStatus } from './enums.js';
import type { Timestamps } from './common.js';

export type ExecutionProviderKind = 'mock' | 'blockchain' | 'nox';

export interface Organization extends Timestamps {
  id: string;
  name: string;
  legalName: string | null;
  taxId: string | null;
  status: OrganizationStatus;
  safeAddress: string | null;
  network: string | null;
  executionProvider: ExecutionProviderKind | string;
  confidentialTokenAddress: string | null;
  currency: string;
  timezone: string;
  logoUrl: string | null;
}

export interface TreasuryStatus {
  safeAddress: string | null;
  network: string | null;
  executionProvider: ExecutionProviderKind | string;
  confidentialTokenAddress: string | null;
  configured: boolean;
  ready: boolean;
  status: 'not_configured' | 'configured' | 'ready' | 'blockchain_pending';
  message: string;
}

export interface CreateOrganizationInput {
  name: string;
  legalName?: string;
  taxId?: string;
  currency?: string;
  timezone?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  legalName?: string | null;
  taxId?: string | null;
  status?: OrganizationStatus;
  safeAddress?: string | null;
  network?: string | null;
  executionProvider?: ExecutionProviderKind | string;
  confidentialTokenAddress?: string | null;
  currency?: string;
  timezone?: string;
  logoUrl?: string | null;
}

export interface OrganizationSettings {
  id: string;
  organizationId: string;
  payrollApprovalRequired: boolean;
  defaultApprovalSequence: string[];
  autoGeneratePayrollItems: boolean;
  notificationEmailEnabled: boolean;
  fiscalYearStartMonth: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrganizationSettingsInput {
  payrollApprovalRequired?: boolean;
  defaultApprovalSequence?: string[];
  autoGeneratePayrollItems?: boolean;
  notificationEmailEnabled?: boolean;
  fiscalYearStartMonth?: number;
}
