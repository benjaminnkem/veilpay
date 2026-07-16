import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UserRole } from '@repo/types';

export interface JwtPayloadUser {
  id: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
  firstName: string;
  lastName: string;
}

export const CurrentUser = createParamDecorator(
  (
    data: keyof JwtPayloadUser | undefined,
    ctx: ExecutionContext,
  ): JwtPayloadUser | string | null => {
    const request = ctx.switchToHttp().getRequest<Request & { user: JwtPayloadUser }>();
    const user = request.user;
    if (!user) return null;
    return data ? user[data] : user;
  },
);
