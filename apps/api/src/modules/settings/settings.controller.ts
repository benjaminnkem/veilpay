import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@repo/types';
import {
  CurrentUser,
  type JwtPayloadUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get organization settings' })
  get(@CurrentUser() user: JwtPayloadUser) {
    return this.settingsService.get(user);
  }

  @Patch()
  @Roles(UserRole.OWNER, UserRole.CEO, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update organization settings' })
  update(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.settingsService.update(user, dto);
  }
}
