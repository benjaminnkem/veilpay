import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { JwtPayloadUser } from '../decorators/current-user.decorator';

export function requireOrganizationId(user: JwtPayloadUser): string {
  if (!user.organizationId) {
    throw new BadRequestException(
      'User is not associated with an organization',
    );
  }
  return user.organizationId;
}

export function assertSameOrganization(
  user: JwtPayloadUser,
  organizationId: string,
): void {
  if (user.role === 'SUPER_ADMIN') return;
  if (user.organizationId !== organizationId) {
    throw new ForbiddenException('Resource belongs to another organization');
  }
}
