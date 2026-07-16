import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@repo/types';
import {
  CurrentUser,
  type JwtPayloadUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CompensationService } from './compensation.service';
import { CreateCompensationDto } from './dto/create-compensation.dto';
import {
  EndCompensationDto,
  UpdateCompensationDto,
} from './dto/update-compensation.dto';

@ApiTags('compensation')
@ApiBearerAuth()
@Controller('compensation')
export class CompensationController {
  constructor(private readonly compensationService: CompensationService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.HR, UserRole.FINANCE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create compensation record' })
  create(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: CreateCompensationDto,
  ) {
    return this.compensationService.create(user, dto);
  }

  @Get('employee/:employeeId')
  @Roles(
    UserRole.OWNER,
    UserRole.HR,
    UserRole.FINANCE,
    UserRole.CEO,
    UserRole.AUDITOR,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'List compensation history for employee' })
  findByEmployee(
    @CurrentUser() user: JwtPayloadUser,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.compensationService.findByEmployee(user, employeeId);
  }

  @Get('employee/:employeeId/current')
  @Roles(
    UserRole.OWNER,
    UserRole.HR,
    UserRole.FINANCE,
    UserRole.CEO,
    UserRole.AUDITOR,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Current compensation for employee' })
  getCurrent(
    @CurrentUser() user: JwtPayloadUser,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.compensationService.getCurrent(user, employeeId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.HR, UserRole.FINANCE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update compensation record' })
  update(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompensationDto,
  ) {
    return this.compensationService.update(user, id, dto);
  }

  @Post(':id/end')
  @Roles(UserRole.OWNER, UserRole.HR, UserRole.FINANCE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'End a current compensation (no hard delete)' })
  end(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EndCompensationDto,
  ) {
    return this.compensationService.end(user, id, dto);
  }
}
