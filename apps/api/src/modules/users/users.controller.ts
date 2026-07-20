import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { UsersService } from './users.service';
import { UpdateProfileDto, UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.HR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List organization users' })
  findAll(@CurrentUser() user: JwtPayloadUser, @Query() query: PaginationDto) {
    return this.usersService.findAll(user, query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get own profile (alias)' })
  me(@CurrentUser() user: JwtPayloadUser) {
    return this.usersService.findOne(user, user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own profile' })
  updateProfile(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  findOne(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.findOne(user, id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.HR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update user (admin)' })
  update(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(user, id, dto);
  }
}
