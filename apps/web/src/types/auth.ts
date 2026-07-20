import type { UserRole } from '@repo/types';

export type { UserRole };

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: UserRole | string;
  organizationId?: string | null;
  organizationName?: string | null;
  avatarUrl?: string | null;
  walletAddress?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole | string;
  organizationId?: string | null;
  organizationName?: string | null;
  avatarUrl?: string | null;
  accessToken?: string;
}
