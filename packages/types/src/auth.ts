import type { UserRole } from './enums.js';
import type { Timestamps } from './common.js';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string | null;
  organizationName: string | null;
  avatarUrl: string | null;
  walletAddress: string | null;
  isActive: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface UserProfile extends AuthUser, Timestamps {
  lastLoginAt: string | null;
}
