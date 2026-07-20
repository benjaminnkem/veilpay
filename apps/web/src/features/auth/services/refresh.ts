import { publicPost } from '@/lib/api';
import type { LoginResponse } from '@/types/auth';

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user?: LoginResponse['user'];
}

export async function refreshTokens(
  refreshToken: string
): Promise<RefreshTokenResponse> {
  return publicPost<RefreshTokenResponse, { refreshToken: string }>(
    '/auth/refresh',
    { refreshToken }
  );
}
