import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../common/auth-context';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  UpdateMemberRoleDto,
} from '../common/dto';
import { ApiEndpoint, companyParam } from '../common/openapi.decorators';
import {
  CompanyMemberResponseDto,
  CompanyResponseDto,
} from '../common/openapi.models';
import { CompaniesService } from './companies.service';

@ApiBearerAuth()
@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}
  @ApiEndpoint({
    summary: 'Create a company tenant',
    description:
      'Creates a tenant and an active OWNER membership transactionally. A verified wallet is required before Safe deployment, not company creation.',
    response: CompanyResponseDto,
    created: true,
    idempotent: true,
  })
  @Post()
  create(@CurrentUser() u: AuthUser, @Body() dto: CreateCompanyDto) {
    return this.companies.create(u.id, dto.name);
  }
  @ApiEndpoint({
    summary: 'List accessible companies',
    description:
      'Returns companies for which the caller has an active membership, including Safe account metadata.',
    response: CompanyResponseDto,
    isArray: true,
  })
  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.companies.list(u.id);
  }
  @ApiEndpoint({
    summary: 'Get a company',
    description:
      'Returns one tenant and its Safe account metadata after active membership validation.',
    response: CompanyResponseDto,
    params: [companyParam],
  })
  @Get(':companyId')
  get(@CurrentUser() u: AuthUser, @Param('companyId') id: string) {
    return this.companies.get(u.id, id);
  }
  @ApiEndpoint({
    summary: 'Update a company',
    description: 'Updates the company name. Requires OWNER or ADMIN.',
    response: CompanyResponseDto,
    params: [companyParam],
  })
  @Patch(':companyId')
  update(
    @CurrentUser() u: AuthUser,
    @Param('companyId') id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companies.update(u.id, id, dto.name);
  }
  @ApiEndpoint({
    summary: 'List company members',
    description:
      'Returns active and inactive company memberships with non-sensitive user identity fields.',
    response: CompanyMemberResponseDto,
    isArray: true,
    params: [companyParam],
  })
  @Get(':companyId/members')
  members(@CurrentUser() u: AuthUser, @Param('companyId') id: string) {
    return this.companies.members(u.id, id);
  }
  @ApiEndpoint({
    summary: 'Change a member role',
    description:
      'Changes a non-owner member role. Requires OWNER; the OWNER role is immutable.',
    response: CompanyMemberResponseDto,
    params: [
      companyParam,
      {
        name: 'memberId',
        description: 'Company membership UUID.',
        format: 'uuid',
      },
    ],
  })
  @Patch(':companyId/members/:memberId/role')
  role(
    @CurrentUser() u: AuthUser,
    @Param('companyId') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.companies.updateRole(u.id, id, memberId, dto.role);
  }
}
