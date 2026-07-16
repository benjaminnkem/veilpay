import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@repo/types';
import {
  CurrentUser,
  type JwtPayloadUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current organization' })
  getMine(@CurrentUser() user: JwtPayloadUser) {
    return this.organizationsService.getMine(user);
  }

  @Patch('me')
  @Roles(UserRole.OWNER, UserRole.CEO, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update current organization' })
  updateMine(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.updateMine(user, dto);
  }
}
