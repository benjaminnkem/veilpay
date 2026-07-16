export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
}

type TokenListener = (tokens: StoredTokens | null) => void;

let tokens: StoredTokens | null = null;
const listeners = new Set<TokenListener>();

export function getStoredTokens(): StoredTokens | null {
  return tokens;
}

export function getStoredAccessToken(): string | null {
  return tokens?.accessToken ?? null;
}

export function getStoredRefreshToken(): string | null {
  return tokens?.refreshToken ?? null;
}

export function setStoredTokens(next: StoredTokens | null): void {
  tokens = next;
  listeners.forEach((listener) => listener(tokens));
}

export function clearStoredTokens(): void {
  setStoredTokens(null);
}

export function onTokensChange(listener: TokenListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function tokensFromAuthResponse(data: {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  previousRefreshToken?: string | null;
}): StoredTokens | null {
  const refreshToken = data.refreshToken ?? data.previousRefreshToken ?? null;
  if (!data.accessToken || !refreshToken) {
    return null;
  }

  const expiresInMs = (data.expiresIn ?? 900) * 1000;

  return {
    accessToken: data.accessToken,
    refreshToken,
    accessTokenExpires: Date.now() + expiresInMs,
  };
}
