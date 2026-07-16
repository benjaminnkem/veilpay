import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { PayrollService } from './payroll.service';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { UpdatePayrollDto } from './dto/update-payroll.dto';
import { UpdatePayrollItemDto } from './dto/update-payroll-item.dto';
import { PayrollQueryDto } from './dto/payroll-query.dto';

@ApiTags('payroll')
@ApiBearerAuth()
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.HR, UserRole.FINANCE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create draft payroll and generate items' })
  create(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: CreatePayrollDto,
  ) {
    return this.payrollService.create(user, dto);
  }

  @Get()
  @Roles(
    UserRole.OWNER,
    UserRole.HR,
    UserRole.FINANCE,
    UserRole.CEO,
    UserRole.AUDITOR,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'List payroll runs' })
  findAll(
    @CurrentUser() user: JwtPayloadUser,
    @Query() query: PayrollQueryDto,
  ) {
    return this.payrollService.findAll(user, query);
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
  @ApiOperation({ summary: 'Get payroll with items' })
  findOne(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.payrollService.findOne(user, id);
  }

  @Get(':id/preview')
  @Roles(
    UserRole.OWNER,
    UserRole.HR,
    UserRole.FINANCE,
    UserRole.CEO,
    UserRole.AUDITOR,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Preview payroll totals and items' })
  preview(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.payrollService.preview(user, id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.HR, UserRole.FINANCE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update draft payroll metadata' })
  update(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePayrollDto,
  ) {
    return this.payrollService.update(user, id, dto);
  }

  @Post(':id/regenerate')
  @Roles(UserRole.OWNER, UserRole.HR, UserRole.FINANCE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Regenerate payroll items from compensation' })
  regenerate(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { employeeIds?: string[] },
  ) {
    return this.payrollService.regenerate(user, id, body.employeeIds);
  }

  @Patch(':id/items/:itemId')
  @Roles(UserRole.OWNER, UserRole.HR, UserRole.FINANCE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Adjust payroll line item' })
  updateItem(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdatePayrollItemDto,
  ) {
    return this.payrollService.updateItem(user, id, itemId, dto);
  }

  @Post(':id/submit')
  @Roles(UserRole.OWNER, UserRole.HR, UserRole.FINANCE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Submit payroll for approval' })
  submit(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.payrollService.submit(user, id);
  }

  @Post(':id/execute')
  @Roles(UserRole.OWNER, UserRole.FINANCE, UserRole.CEO, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Execute payroll via PaymentProvider (mock until blockchain)',
  })
  execute(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.payrollService.execute(user, id);
  }

  @Post(':id/cancel')
  @Roles(UserRole.OWNER, UserRole.HR, UserRole.FINANCE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cancel payroll' })
  cancel(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.payrollService.cancel(user, id);
  }
}
