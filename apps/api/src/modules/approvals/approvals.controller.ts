import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@repo/types';
import {
  CurrentUser,
  type JwtPayloadUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApprovalsService } from './approvals.service';
import { ApprovalActionDto } from './dto/approval-action.dto';

@ApiTags('approvals')
@ApiBearerAuth()
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  @Roles(
    UserRole.OWNER,
    UserRole.HR,
    UserRole.FINANCE,
    UserRole.CEO,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'List pending approvals for current role' })
  findPending(
    @CurrentUser() user: JwtPayloadUser,
    @Query() query: PaginationDto,
  ) {
    return this.approvalsService.findPending(user, query);
  }

  @Get('payroll/:payrollId')
  @Roles(
    UserRole.OWNER,
    UserRole.HR,
    UserRole.FINANCE,
    UserRole.CEO,
    UserRole.AUDITOR,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Approval timeline for a payroll' })
  timeline(
    @CurrentUser() user: JwtPayloadUser,
    @Param('payrollId', ParseUUIDPipe) payrollId: string,
  ) {
    return this.approvalsService.timeline(user, payrollId);
  }

  @Post(':id/approve')
  @Roles(
    UserRole.OWNER,
    UserRole.HR,
    UserRole.FINANCE,
    UserRole.CEO,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Approve current step' })
  approve(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.approvalsService.approve(user, id, dto);
  }

  @Post(':id/reject')
  @Roles(
    UserRole.OWNER,
    UserRole.HR,
    UserRole.FINANCE,
    UserRole.CEO,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Reject current step' })
  reject(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.approvalsService.reject(user, id, dto);
  }
}
