import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { login } from '@/features/auth/services/login';
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
        token.avatarUrl = user.avatarUrl;
        token.accessToken = user.accessToken;
      }

      return token;
    },
    async session({ session, token }) {
      const role = (token.role as UserRole | undefined) ?? 'viewer';

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

      return session;
    },
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
});
