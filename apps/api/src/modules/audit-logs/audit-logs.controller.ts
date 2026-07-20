import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@repo/types';
import {
  CurrentUser,
  type JwtPayloadUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { requireOrganizationId } from '../../common/utils/org.util';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@ApiTags('audit-logs')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles(
    UserRole.OWNER,
    UserRole.HR,
    UserRole.FINANCE,
    UserRole.CEO,
    UserRole.AUDITOR,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'List audit logs for the organization' })
  async findAll(
    @CurrentUser() user: JwtPayloadUser,
    @Query() query: AuditLogQueryDto,
  ) {
    const orgId =
      user.role === UserRole.SUPER_ADMIN
        ? user.organizationId
        : requireOrganizationId(user);
    return this.auditLogsService.findAll(orgId, query);
  }

  @Get(':id')
  @Roles(
    UserRole.OWNER,
    UserRole.HR,
    UserRole.FINANCE,
    UserRole.CEO,
    UserRole.AUDITOR,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Get a single audit log entry' })
  async findOne(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
  ) {
    const orgId =
      user.role === UserRole.SUPER_ADMIN
        ? user.organizationId
        : requireOrganizationId(user);
    const entry = await this.auditLogsService.findOne(id, orgId);
    if (!entry) throw new NotFoundException('Audit log not found');
    return {
      id: entry.id,
      organizationId: entry.organizationId,
      actorId: entry.actorId,
      actorEmail: entry.actorEmail,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    };
  }
}
