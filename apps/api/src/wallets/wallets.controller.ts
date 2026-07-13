import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../common/auth-context';
import { WalletChallengeDto, WalletVerifyDto } from '../common/dto';
import { WalletsService } from './wallets.service';
import { ApiEndpoint } from '../common/openapi.decorators';
import {
  SelectedResponseDto,
  UnlinkedResponseDto,
  WalletChallengeResponseDto,
  WalletResponseDto,
} from '../common/openapi.models';
@ApiBearerAuth()
@ApiTags('Wallets')
@Controller('wallets')
export class WalletsController {
  constructor(private readonly wallets: WalletsService) {}
  @ApiEndpoint({
    summary: 'Create a SIWE challenge',
    description:
      'Creates a five-minute, single-use EIP-4361 message bound to the caller, address, domain, URI, and configured chain.',
    response: WalletChallengeResponseDto,
    created: true,
  })
  @Post('challenge')
  challenge(@CurrentUser() u: AuthUser, @Body() d: WalletChallengeDto) {
    return this.wallets.challenge(u.id, d.address, d.chainId);
  }
  @ApiEndpoint({
    summary: 'Verify wallet ownership',
    description:
      'Verifies the exact challenge message and wallet signature, consumes the nonce atomically, and links the checksummed address.',
    response: WalletResponseDto,
    created: true,
  })
  @Post('verify')
  verify(@CurrentUser() u: AuthUser, @Body() d: WalletVerifyDto) {
    return this.wallets.verify(u.id, d.challengeId, d.message, d.signature);
  }
  @ApiEndpoint({
    summary: 'List verified wallets',
    description:
      'Returns only wallets linked to the authenticated account, with the primary wallet first.',
    response: WalletResponseDto,
    isArray: true,
  })
  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.wallets.list(u.id);
  }
  @ApiEndpoint({
    summary: 'Select the primary wallet',
    description:
      'Selects the wallet used for new Safe-owner and employee-wallet workflows.',
    response: SelectedResponseDto,
    params: [
      {
        name: 'walletId',
        description: 'Verified wallet UUID owned by the caller.',
        format: 'uuid',
      },
    ],
  })
  @Patch(':walletId/primary')
  primary(@CurrentUser() u: AuthUser, @Param('walletId') id: string) {
    return this.wallets.primary(u.id, id);
  }
  @ApiEndpoint({
    summary: 'Unlink a wallet',
    description:
      'Deletes a wallet only when it is not referenced by a Safe deployment intent or employee profile.',
    response: UnlinkedResponseDto,
    params: [
      {
        name: 'walletId',
        description: 'Verified wallet UUID owned by the caller.',
        format: 'uuid',
      },
    ],
  })
  @Delete(':walletId')
  unlink(@CurrentUser() u: AuthUser, @Param('walletId') id: string) {
    return this.wallets.unlink(u.id, id);
  }
}
