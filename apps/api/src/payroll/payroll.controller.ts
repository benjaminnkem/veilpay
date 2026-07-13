import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../common/auth-context';
import {
  CreatePayrollDto,
  PageDto,
  ProposeDto,
  TransactionHashDto,
  UpdatePayrollDto,
} from '../common/dto';
import { PayrollService } from './payroll.service';
import {
  ApiEndpoint,
  companyParam,
  payrollParam,
} from '../common/openapi.decorators';
import {
  PayrollApprovalResponseDto,
  PayrollCancellationResponseDto,
  PayrollReconciliationResponseDto,
  PayrollResponseDto,
  PayrollSafeTransactionResponseDto,
  PayrollStatusResponseDto,
  PayrollSummaryResponseDto,
} from '../common/openapi.models';
@ApiBearerAuth()
@ApiTags('Payroll')
@Controller('companies/:companyId/payroll-runs')
export class PayrollController {
  constructor(private readonly p: PayrollService) {}
  @ApiEndpoint({
    summary: 'Create a payroll draft',
    description:
      'Snapshots eligible active employees, verified recipient wallets, encrypted salaries, token, Safe, and contract metadata into an immutable draft boundary.',
    response: PayrollResponseDto,
    created: true,
    idempotent: true,
    params: [companyParam],
  })
  @Post()
  create(
    @CurrentUser() u: AuthUser,
    @Param('companyId') c: string,
    @Body() d: CreatePayrollDto,
  ) {
    return this.p.create(u.id, c, d.label, d.employeeIds, d.expiresInSeconds);
  }
  @ApiEndpoint({
    summary: 'List payroll runs',
    description:
      'Returns a paginated tenant-scoped summary ordered newest first. No salary plaintext or confidential proofs are returned.',
    response: PayrollSummaryResponseDto,
    isArray: true,
    params: [companyParam],
  })
  @Get()
  list(
    @CurrentUser() u: AuthUser,
    @Param('companyId') c: string,
    @Query() q: PageDto,
  ) {
    return this.p.list(u.id, c, (q.page - 1) * q.limit, q.limit);
  }
  @ApiEndpoint({
    summary: 'Get a payroll run',
    description:
      'Returns payroll orchestration state and sanitized item metadata. Confidential input proofs and salary ciphertext are not part of the documented response.',
    response: PayrollResponseDto,
    params: [companyParam, payrollParam],
  })
  @Get(':id')
  get(
    @CurrentUser() u: AuthUser,
    @Param('companyId') c: string,
    @Param('id') id: string,
  ) {
    return this.p.get(u.id, c, id);
  }
  @ApiEndpoint({
    summary: 'Update a payroll draft',
    description:
      'Changes the label or resnapshots selected employees only while the payroll is DRAFT.',
    response: PayrollResponseDto,
    params: [companyParam, payrollParam],
  })
  @Patch(':id')
  update(
    @CurrentUser() u: AuthUser,
    @Param('companyId') c: string,
    @Param('id') id: string,
    @Body() d: UpdatePayrollDto,
  ) {
    return this.p.updateDraft(u.id, c, id, d.label, d.employeeIds);
  }
  @ApiEndpoint({
    summary: 'Prepare confidential payroll inputs',
    description:
      'Atomically claims the draft, validates recipients and amounts, encrypts Nox inputs for the payroll contract, computes the canonical manifest, and transitions to PREPARED.',
    response: PayrollResponseDto,
    created: true,
    idempotent: true,
    params: [companyParam, payrollParam],
  })
  @Post(':id/prepare')
  prepare(
    @CurrentUser() u: AuthUser,
    @Param('companyId') c: string,
    @Param('id') id: string,
  ) {
    return this.p.prepare(u.id, c, id);
  }
  @ApiEndpoint({
    summary: 'Build the Safe approval transaction',
    description:
      'Returns deterministic Safe transaction data for bounded token operator permission plus exact manifest approval. The backend never signs as a Safe owner.',
    response: PayrollSafeTransactionResponseDto,
    created: true,
    idempotent: true,
    params: [companyParam, payrollParam],
  })
  @Post(':id/safe-transaction')
  safe(
    @CurrentUser() u: AuthUser,
    @Param('companyId') c: string,
    @Param('id') id: string,
  ) {
    return this.p.buildSafeTransaction(u.id, c, id);
  }
  @ApiEndpoint({
    summary: 'Submit a Safe-owner proposal signature',
    description:
      'Verifies the signer against current Safe owners, normalizes the signature for Safe ETH_SIGN, and proposes the stored transaction to Safe Transaction Service.',
    response: PayrollStatusResponseDto,
    created: true,
    idempotent: true,
    params: [companyParam, payrollParam],
  })
  @Post(':id/propose')
  propose(
    @CurrentUser() u: AuthUser,
    @Param('companyId') c: string,
    @Param('id') id: string,
    @Body() d: ProposeDto,
  ) {
    return this.p.propose(
      u.id,
      c,
      id,
      d.senderAddress as `0x${string}`,
      d.senderSignature as `0x${string}`,
    );
  }
  @ApiEndpoint({
    summary: 'Verify executed Safe approval',
    description:
      'Verifies the Safe execution receipt and directly reads the payroll contract to confirm the exact manifest, token, and item count before SAFE_APPROVED.',
    response: PayrollApprovalResponseDto,
    created: true,
    idempotent: true,
    params: [companyParam, payrollParam],
  })
  @Post(':id/sync-safe-approval')
  sync(
    @CurrentUser() u: AuthUser,
    @Param('companyId') c: string,
    @Param('id') id: string,
    @Body() d: TransactionHashDto,
  ) {
    return this.p.syncApproval(u.id, c, id, d.txHash);
  }
  @ApiEndpoint({
    summary: 'Execute an approved confidential payroll',
    description:
      'Atomically claims SAFE_APPROVED state, revalidates on-chain approval and operator permission, simulates the exact call, relays it, and verifies receipt, event, and final state.',
    response: PayrollResponseDto,
    created: true,
    idempotent: true,
    params: [companyParam, payrollParam],
  })
  @Post(':id/execute')
  execute(
    @CurrentUser() u: AuthUser,
    @Param('companyId') c: string,
    @Param('id') id: string,
  ) {
    return this.p.execute(u.id, c, id);
  }
  @ApiEndpoint({
    summary: 'Cancel a payroll',
    description:
      'Cancels DRAFT/PREPARED runs locally. For an on-chain approved run, returns exact Safe calldata that a company owner must execute.',
    response: PayrollCancellationResponseDto,
    created: true,
    idempotent: true,
    params: [companyParam, payrollParam],
  })
  @Post(':id/cancel')
  cancel(
    @CurrentUser() u: AuthUser,
    @Param('companyId') c: string,
    @Param('id') id: string,
  ) {
    return this.p.cancel(u.id, c, id);
  }
  @ApiEndpoint({
    summary: 'Reconcile payroll state from chain',
    description:
      'Reads the payroll contract approval directly and repairs database orchestration status without trusting an indexer alone.',
    response: PayrollReconciliationResponseDto,
    created: true,
    idempotent: true,
    params: [companyParam, payrollParam],
  })
  @Post(':id/reconcile')
  reconcile(
    @CurrentUser() u: AuthUser,
    @Param('companyId') c: string,
    @Param('id') id: string,
  ) {
    return this.p.reconcile(u.id, c, id);
  }
}
