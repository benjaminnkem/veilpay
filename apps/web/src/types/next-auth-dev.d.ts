import type { DefaultSession } from 'next-auth';

import type { UserRole } from '@/types/auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole | string;
      organizationId?: string | null;
      organizationName?: string | null;
      avatarUrl?: string | null;
      accessToken?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole | string;
    organizationId?: string | null;
    organizationName?: string | null;
    avatarUrl?: string | null;
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    email?: string;
    name?: string;
    role?: UserRole | string;
    organizationId?: string | null;
    organizationName?: string | null;
    avatarUrl?: string | null;
    accessToken?: string;
  }
}
