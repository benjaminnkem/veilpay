import { Body, Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../common/auth-context';
import { FundingIntentDto, TransactionHashDto } from '../common/dto';
import { SafeService } from './safe.service';
import { ApiError } from '../common/api-error';
import { ApiEndpoint, companyParam } from '../common/openapi.decorators';
import {
  FundingIntentResponseDto,
  FundingRecordResponseDto,
  SafeAccountResponseDto,
  SafeDeploymentIntentResponseDto,
  SafeSyncResponseDto,
  TreasuryBalanceHandleResponseDto,
} from '../common/openapi.models';
@ApiBearerAuth()
@ApiTags('Safe and treasury')
@Controller('companies/:companyId')
export class SafeController {
  constructor(private readonly safe: SafeService) {}
  @ApiEndpoint({
    summary: 'Create a Safe deployment intent',
    description:
      'Builds a deterministic user-signable 1-of-1 Safe deployment transaction owned by the caller’s verified primary wallet. The backend never signs it.',
    response: SafeDeploymentIntentResponseDto,
    created: true,
    idempotent: true,
    params: [companyParam],
  })
  @Post('safe/deployment-intents')
  intent(@CurrentUser() u: AuthUser, @Param('companyId') c: string) {
    return this.safe.deploymentIntent(u.id, c);
  }
  @ApiEndpoint({
    summary: 'Confirm a Safe deployment transaction',
    description:
      'Verifies the receipt, bytecode, predicted address, owner list, and threshold directly on-chain before activating the company treasury.',
    response: SafeAccountResponseDto,
    created: true,
    idempotent: true,
    params: [
      companyParam,
      {
        name: 'intentId',
        description: 'Safe deployment intent UUID.',
        format: 'uuid',
      },
    ],
  })
  @Post('safe/deployment-intents/:intentId/submit')
  submit(
    @CurrentUser() u: AuthUser,
    @Param('companyId') c: string,
    @Param('intentId') i: string,
    @Body() d: TransactionHashDto,
  ) {
    return this.safe.submitDeployment(u.id, c, i, d.txHash);
  }
  @ApiEndpoint({
    summary: 'Synchronize Safe state',
    description:
      'Reads Safe deployment, owners, and threshold from chain and refreshes verified database metadata.',
    response: SafeSyncResponseDto,
    created: true,
    params: [companyParam],
  })
  @Post('safe/sync')
  sync(@CurrentUser() u: AuthUser, @Param('companyId') c: string) {
    return this.safe.sync(u.id, c);
  }
  @ApiEndpoint({
    summary: 'Get company Safe metadata',
    description:
      'Returns the Safe account configured for the current chain, or null before an intent is created.',
    response: SafeAccountResponseDto,
    params: [companyParam],
  })
  @Get('safe')
  async get(@CurrentUser() u: AuthUser, @Param('companyId') c: string) {
    const account = await this.safe.get(u.id, c);
    if (!account)
      throw new ApiError(
        'SAFE_NOT_CONFIGURED',
        'Safe is not configured',
        HttpStatus.NOT_FOUND,
      );
    return account;
  }
  @ApiEndpoint({
    summary: 'Create a confidential treasury funding intent',
    description:
      'Builds test-token faucet calldata in integer base units. The recipient, amount, and timing are public in this demo path.',
    response: FundingIntentResponseDto,
    created: true,
    idempotent: true,
    params: [companyParam],
  })
  @Post('treasury/funding-intents')
  funding(
    @CurrentUser() u: AuthUser,
    @Param('companyId') c: string,
    @Body() d: FundingIntentDto,
  ) {
    return this.safe.fundingIntent(u.id, c, d.amountBaseUnits);
  }
  @ApiEndpoint({
    summary: 'Confirm treasury funding',
    description:
      'Verifies the transaction receipt and reads the Safe confidential balance handle from chain before marking funding verified.',
    response: FundingRecordResponseDto,
    created: true,
    idempotent: true,
    params: [
      companyParam,
      {
        name: 'intentId',
        description: 'Treasury funding intent UUID.',
        format: 'uuid',
      },
    ],
  })
  @Post('treasury/funding-intents/:intentId/submit')
  submitFunding(
    @CurrentUser() u: AuthUser,
    @Param('companyId') c: string,
    @Param('intentId') i: string,
    @Body() d: TransactionHashDto,
  ) {
    return this.safe.submitFunding(u.id, c, i, d.txHash);
  }
  @ApiEndpoint({
    summary: 'Get the treasury confidential balance handle',
    description:
      'Returns the encrypted ERC-7984 balance handle for the company Safe. The backend does not decrypt it.',
    response: TreasuryBalanceHandleResponseDto,
    params: [companyParam],
  })
  @Get('treasury/balance-handle')
  async balance(@CurrentUser() u: AuthUser, @Param('companyId') c: string) {
    const s = await this.safe.get(u.id, c);
    return {
      token: process.env.CONFIDENTIAL_TOKEN_ADDRESS,
      account: s?.address,
      handle: s?.address
        ? await this.safe.balanceHandle(s.address as `0x${string}`)
        : null,
    };
  }
}
