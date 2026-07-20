import {
  Body,
  Controller,
  Delete,
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
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { SetPayoutWalletDto } from './dto/set-payout-wallet.dto';

@ApiTags('employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.HR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create employee' })
  create(@CurrentUser() user: JwtPayloadUser, @Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(user, dto);
  }

  @Post('import')
  @Roles(UserRole.OWNER, UserRole.HR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Bulk import employees (JSON rows / CSV placeholder)',
  })
  bulkImport(
    @CurrentUser() user: JwtPayloadUser,
    @Body()
    body: {
      rows: Array<{
        firstName: string;
        lastName: string;
        email: string;
        department?: string;
        position?: string;
        walletAddress?: string;
      }>;
    },
  ) {
    return this.employeesService.bulkImport(user, body.rows ?? []);
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
  @ApiOperation({ summary: 'List employees' })
  findAll(
    @CurrentUser() user: JwtPayloadUser,
    @Query() query: EmployeeQueryDto,
  ) {
    return this.employeesService.findAll(user, query);
  }

  @Get('departments')
  @Roles(
    UserRole.OWNER,
    UserRole.HR,
    UserRole.FINANCE,
    UserRole.CEO,
    UserRole.AUDITOR,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'List departments with counts' })
  departments(@CurrentUser() user: JwtPayloadUser) {
    return this.employeesService.departments(user);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the employee record linked to the current user' })
  getMe(@CurrentUser() user: JwtPayloadUser) {
    return this.employeesService.getMe(user);
  }

  @Post('me/wallet')
  @ApiOperation({
    summary: 'Link payout wallet to the current user employee record',
  })
  setMyWallet(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: SetPayoutWalletDto,
  ) {
    return this.employeesService.setMyPayoutWallet(user, dto);
  }

  @Delete('me/wallet')
  @ApiOperation({ summary: 'Clear payout wallet on the current employee record' })
  clearMyWallet(@CurrentUser() user: JwtPayloadUser) {
    return this.employeesService.clearMyPayoutWallet(user);
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
  @ApiOperation({ summary: 'Get employee' })
  findOne(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.employeesService.findOne(user, id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.HR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update employee' })
  update(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(user, id, dto);
  }

  @Post(':id/suspend')
  @Roles(UserRole.OWNER, UserRole.HR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Suspend employee' })
  suspend(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.employeesService.suspend(user, id);
  }

  @Post(':id/reactivate')
  @Roles(UserRole.OWNER, UserRole.HR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reactivate employee' })
  reactivate(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.employeesService.reactivate(user, id);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.HR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Terminate employee (soft delete)' })
  remove(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.employeesService.remove(user, id);
  }
}
