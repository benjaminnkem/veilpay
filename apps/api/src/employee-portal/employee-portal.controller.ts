import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../common/auth-context';
import { PrismaService } from '../database/prisma.service';
import { SafeService } from '../safe/safe.service';
import { ApiError } from '../common/api-error';
import { ApiEndpoint } from '../common/openapi.decorators';
import {
  EmployeeBalanceHandleResponseDto,
  EmployeeCompanyResponseDto,
  EmployeePaymentResponseDto,
} from '../common/openapi.models';
@ApiBearerAuth()
@ApiTags('Employee portal')
@Controller('employee')
export class EmployeePortalController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly safe: SafeService,
  ) {}
  @ApiEndpoint({
    summary: 'List employee companies',
    description:
      'Returns employee profiles and company summaries belonging to the authenticated user.',
    response: EmployeeCompanyResponseDto,
    isArray: true,
  })
  @Get('companies')
  companies(@CurrentUser() u: AuthUser) {
    return this.prisma.employeeProfile.findMany({
      where: { userId: u.id },
      select: {
        id: true,
        employmentStatus: true,
        company: { select: { id: true, name: true, status: true } },
      },
    });
  }
  @ApiEndpoint({
    summary: 'List confirmed payroll payments',
    description:
      'Returns executed payroll payment metadata for the authenticated employee. Confidential salary amounts are never returned.',
    response: EmployeePaymentResponseDto,
    isArray: true,
  })
  @Get('payments')
  payments(@CurrentUser() u: AuthUser) {
    return this.prisma.payrollItem.findMany({
      where: {
        employeeProfile: { userId: u.id },
        payrollRun: { status: 'EXECUTED' },
      },
      select: {
        id: true,
        status: true,
        txHash: true,
        blockNumber: true,
        createdAt: true,
        payrollRun: {
          select: {
            id: true,
            label: true,
            executedAt: true,
            tokenAddress: true,
            chainId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  @ApiQuery({
    name: 'companyId',
    required: true,
    format: 'uuid',
    description: 'Company UUID for an active employee profile.',
  })
  @ApiEndpoint({
    summary: 'Get an employee confidential balance handle',
    description:
      'Returns the authenticated employee wallet’s encrypted ERC-7984 balance handle and client-side decryption guidance. The backend never decrypts balances.',
    response: EmployeeBalanceHandleResponseDto,
  })
  @Get('confidential-balance-handle')
  async balance(
    @CurrentUser() u: AuthUser,
    @Query('companyId') companyId: string,
  ) {
    const profile = await this.prisma.employeeProfile.findFirst({
      where: { userId: u.id, companyId, employmentStatus: 'ACTIVE' },
      include: { wallet: true },
    });
    if (!profile?.wallet)
      throw new ApiError(
        'EMPLOYEE_WALLET_REQUIRED',
        'Active employee and verified wallet required',
      );
    const handle = await this.safe.balanceHandle(
      profile.wallet.address as `0x${string}`,
    );
    return {
      chainId: Number(process.env.WEB3_CHAIN_ID),
      tokenAddress: process.env.CONFIDENTIAL_TOKEN_ADDRESS,
      walletAddress: profile.wallet.address,
      handle,
      decryption:
        'Use @iexec-nox/handle with this wallet client; the backend never decrypts the handle.',
    };
  }
}
