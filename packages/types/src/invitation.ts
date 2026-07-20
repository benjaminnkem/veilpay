import type {
  CompensationFrequency,
  InvitationStatus,
  InvitationType,
  UserRole,
} from './enums.js';
import type { Timestamps } from './common.js';

export interface Invitation extends Timestamps {
  id: string;
  organizationId: string;
  email: string;
  role: UserRole;
  type: InvitationType;
  status: InvitationStatus;
  invitedById: string;
  expiresAt: string;
  acceptedAt: string | null;
  firstName: string | null;
  lastName: string | null;
  department: string | null;
  position: string | null;
  startingSalaryCents: number | null;
  salaryCurrency: string | null;
  salaryFrequency: CompensationFrequency | string | null;
  token?: string;
}

export interface CreateInvitationInput {
  email: string;
  role: UserRole;
  type?: InvitationType;
  firstName?: string;
  lastName?: string;
  department?: string;
  position?: string;
  startingSalary?: number;
  startingSalaryCents?: number;
  salaryCurrency?: string;
  salaryFrequency?: CompensationFrequency | string;
  expiresInDays?: number;
}

export interface AcceptInvitationInput {
  token: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface InvitationPublicInfo {
  email: string;
  role: UserRole;
  organizationName: string;
  firstName: string | null;
  lastName: string | null;
  department?: string | null;
  position?: string | null;
  startingSalaryCents?: number | null;
  salaryCurrency?: string | null;
  salaryFrequency?: CompensationFrequency | string | null;
  expiresAt: string;
  status: InvitationStatus;
}
