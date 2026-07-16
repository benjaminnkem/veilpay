import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@repo/types';
import { Public } from '../../common/decorators/public.decorator';
import {
  CurrentUser,
  type JwtPayloadUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.OWNER, UserRole.HR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Invite user or employee' })
  create(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitationsService.create(user, dto);
  }

  @Get()
  @ApiBearerAuth()
  @Roles(UserRole.OWNER, UserRole.HR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List invitations' })
  findAll(
    @CurrentUser() user: JwtPayloadUser,
    @Query() query: PaginationDto,
  ) {
    return this.invitationsService.findAll(user, query);
  }

  @Public()
  @Get('token/:token')
  @ApiOperation({ summary: 'Public invitation preview' })
  getPublic(@Param('token') token: string) {
    return this.invitationsService.getPublicInfo(token);
  }

  @Public()
  @Post('accept')
  @ApiOperation({ summary: 'Accept invitation and create account' })
  accept(@Body() dto: AcceptInvitationDto) {
    return this.invitationsService.accept(dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.OWNER, UserRole.HR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Revoke invitation' })
  revoke(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invitationsService.revoke(user, id);
  }
}
