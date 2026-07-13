import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../common/auth-context';
import {
  AcceptInvitationDto,
  CreateInvitationDto,
  PageDto,
  UpdateEmployeeDto,
} from '../common/dto';
import { EmployeesService } from './employees.service';
import { ApiEndpoint, companyParam } from '../common/openapi.decorators';
import {
  DeactivatedResponseDto,
  EmployeeResponseDto,
  InvitationResponseDto,
} from '../common/openapi.models';
@ApiBearerAuth()
@ApiTags('Employees')
@Controller()
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}
  @ApiEndpoint({
    summary: 'Invite an employee',
    description:
      'Creates a seven-day single-use invitation with AES-256-GCM encrypted salary and pay frequency, stores only the invitation token hash, and enqueues an email. Requires OWNER, ADMIN, or HR.',
    response: InvitationResponseDto,
    created: true,
    idempotent: true,
    params: [companyParam],
  })
  @Post('companies/:companyId/invitations')
  invite(
    @CurrentUser() u: AuthUser,
    @Param('companyId') c: string,
    @Body() d: CreateInvitationDto,
  ) {
    return this.employees.invite(u.id, c, d);
  }
  @ApiEndpoint({
    summary: 'List employee invitations',
    description:
      'Returns invitation metadata without token hashes or production invitation tokens. Requires OWNER, ADMIN, or HR.',
    response: InvitationResponseDto,
    isArray: true,
    params: [companyParam],
  })
  @Get('companies/:companyId/invitations')
  invites(@CurrentUser() u: AuthUser, @Param('companyId') c: string) {
    return this.employees.invitations(u.id, c);
  }
  @ApiEndpoint({
    summary: 'Revoke an invitation',
    description:
      'Revokes a pending invitation so its token can no longer be accepted.',
    response: InvitationResponseDto,
    created: true,
    params: [
      companyParam,
      { name: 'id', description: 'Employee invitation UUID.', format: 'uuid' },
    ],
  })
  @Post('companies/:companyId/invitations/:id/revoke')
  revoke(
    @CurrentUser() u: AuthUser,
    @Param('companyId') c: string,
    @Param('id') id: string,
  ) {
    return this.employees.revoke(u.id, c, id);
  }
  @ApiEndpoint({
    summary: 'Accept an employee invitation',
    description:
      'Consumes a valid token once, enforces invited-email equality, creates an EMPLOYEE membership, and creates the employee profile with salary re-encrypted for the profile and the invited pay frequency.',
    response: EmployeeResponseDto,
    created: true,
  })
  @Post('invitations/accept')
  accept(@CurrentUser() u: AuthUser, @Body() d: AcceptInvitationDto) {
    return this.employees.accept(u.id, d.token);
  }
  @ApiEndpoint({
    summary: 'List company employees',
    description:
      'Returns a paginated tenant-scoped employee list. Salary plaintext is never returned.',
    response: EmployeeResponseDto,
    isArray: true,
    params: [companyParam],
  })
  @Get('companies/:companyId/employees')
  list(
    @CurrentUser() u: AuthUser,
    @Param('companyId') c: string,
    @Query() p: PageDto,
  ) {
    return this.employees.list(u.id, c, (p.page - 1) * p.limit, p.limit);
  }
  @ApiEndpoint({
    summary: 'Get an employee',
    description:
      'Returns one tenant-scoped employee and verified wallet metadata. Salary storage is represented only as [ENCRYPTED].',
    response: EmployeeResponseDto,
    params: [
      companyParam,
      { name: 'id', description: 'Employee profile UUID.', format: 'uuid' },
    ],
  })
  @Get('companies/:companyId/employees/:id')
  get(
    @CurrentUser() u: AuthUser,
    @Param('companyId') c: string,
    @Param('id') id: string,
  ) {
    return this.employees.get(u.id, c, id);
  }
  @ApiEndpoint({
    summary: 'Update an employee',
    description:
      'Updates allowed HR fields. Salary is accepted as a decimal string, validated, and AES-256-GCM encrypted before persistence.',
    response: EmployeeResponseDto,
    params: [
      companyParam,
      { name: 'id', description: 'Employee profile UUID.', format: 'uuid' },
    ],
  })
  @Patch('companies/:companyId/employees/:id')
  update(
    @CurrentUser() u: AuthUser,
    @Param('companyId') c: string,
    @Param('id') id: string,
    @Body() d: UpdateEmployeeDto,
  ) {
    return this.employees.update(u.id, c, id, d);
  }
  @ApiEndpoint({
    summary: 'Activate an employee',
    description:
      'Activates an employee only after a verified wallet, encrypted salary, and confidential token are configured.',
    response: EmployeeResponseDto,
    created: true,
    params: [
      companyParam,
      { name: 'id', description: 'Employee profile UUID.', format: 'uuid' },
    ],
  })
  @Post('companies/:companyId/employees/:id/activate')
  activate(
    @CurrentUser() u: AuthUser,
    @Param('companyId') c: string,
    @Param('id') id: string,
  ) {
    return this.employees.activate(u.id, c, id);
  }
  @ApiEndpoint({
    summary: 'Deactivate an employee',
    description:
      'Marks an employee inactive so future payroll drafts do not include them.',
    response: DeactivatedResponseDto,
    created: true,
    params: [
      companyParam,
      { name: 'id', description: 'Employee profile UUID.', format: 'uuid' },
    ],
  })
  @Post('companies/:companyId/employees/:id/deactivate')
  deactivate(
    @CurrentUser() u: AuthUser,
    @Param('companyId') c: string,
    @Param('id') id: string,
  ) {
    return this.employees.deactivate(u.id, c, id);
  }
}
