import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { login } from '@/features/auth/services/login';
import {
  isAccessTokenFresh,
  refreshAccessToken,
} from '@/lib/auth/refresh-access-token';
import { setStoredTokens, tokensFromAuthResponse } from '@/lib/auth/token-store';
import type { UserRole } from '@/types/auth';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (
          typeof email !== 'string' ||
          typeof password !== 'string' ||
          !email ||
          !password
        ) {
          return null;
        }

        try {
          const result = await login({ email, password });

          return {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role,
            organizationId: result.user.organizationId,
            organizationName: result.user.organizationName,
            avatarUrl: result.user.avatarUrl,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            expiresIn: result.expiresIn,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const expiresIn = user.expiresIn ?? 900;
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
        token.avatarUrl = user.avatarUrl;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = Date.now() + expiresIn * 1000;
        token.error = undefined;

        const stored = tokensFromAuthResponse({
          accessToken: user.accessToken ?? '',
          refreshToken: user.refreshToken,
          expiresIn,
        });
        if (stored) {
          setStoredTokens(stored);
        }

        return token;
      }

      if (trigger === 'update' && session) {
        const updatePayload = session as {
          accessToken?: string;
          refreshToken?: string;
          accessTokenExpires?: number;
        };

        if (typeof updatePayload.accessToken === 'string') {
          token.accessToken = updatePayload.accessToken;
        }
        if (typeof updatePayload.refreshToken === 'string') {
          token.refreshToken = updatePayload.refreshToken;
        }
        if (typeof updatePayload.accessTokenExpires === 'number') {
          token.accessTokenExpires = updatePayload.accessTokenExpires;
        }
        token.error = undefined;

        if (
          typeof token.accessToken === 'string' &&
          typeof token.refreshToken === 'string' &&
          typeof token.accessTokenExpires === 'number'
        ) {
          setStoredTokens({
            accessToken: token.accessToken,
            refreshToken: token.refreshToken,
            accessTokenExpires: token.accessTokenExpires,
          });
        }

        return token;
      }

      if (isAccessTokenFresh(token.accessTokenExpires as number | undefined)) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      const role = (token.role as UserRole | undefined) ?? 'EMPLOYEE';

      session.user = {
        ...session.user,
        id: String(token.id ?? token.sub ?? ''),
        email: String(token.email ?? session.user?.email ?? ''),
        name: String(token.name ?? session.user?.name ?? ''),
        role,
        organizationId: token.organizationId as string | undefined,
        organizationName: token.organizationName as string | undefined,
        avatarUrl: (token.avatarUrl as string | null | undefined) ?? null,
        accessToken: token.accessToken as string | undefined,
      };
      session.accessToken = token.accessToken as string | undefined;
      session.refreshToken = token.refreshToken as string | undefined;
      session.accessTokenExpires = token.accessTokenExpires as
        | number
        | undefined;
      session.error = token.error as string | undefined;

      return session;
    },
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
});
