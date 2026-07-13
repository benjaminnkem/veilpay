import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { formatEther, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { Public } from '../common/auth-context';
import { BlockchainService } from '../blockchain/blockchain.service';
import { PrismaService } from '../database/prisma.service';
import { ApiEndpoint } from '../common/openapi.decorators';
import {
  LivenessResponseDto,
  PublicWeb3ConfigResponseDto,
  ReadinessResponseDto,
} from '../common/openapi.models';
@ApiTags('System')
@Controller()
export class SystemController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chain: BlockchainService,
  ) {}
  @ApiEndpoint({
    summary: 'Check process liveness',
    description:
      'Reports whether the API process can serve requests. It does not test dependencies.',
    response: LivenessResponseDto,
    public: true,
  })
  @Public()
  @Get('health/live')
  live() {
    return { status: 'ok' };
  }
  @ApiEndpoint({
    summary: 'Check service readiness',
    description:
      'Verifies PostgreSQL and RPC access and reports configured contract and relayer metadata without exposing private keys.',
    response: ReadinessResponseDto,
    public: true,
  })
  @Public()
  @Get('health/ready')
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    const block = await this.chain.publicClient.getBlockNumber();
    let relayer: {
      configured: boolean;
      address?: string;
      balanceEth?: string;
    } = { configured: false };
    if (process.env.RELAYER_PRIVATE_KEY) {
      const account = privateKeyToAccount(
        process.env.RELAYER_PRIVATE_KEY as `0x${string}`,
      );
      const balance = await this.chain.publicClient.getBalance({
        address: account.address,
      });
      relayer = {
        configured: true,
        address: account.address,
        balanceEth: formatEther(balance),
      };
    }
    return {
      status: 'ok',
      database: 'ok',
      rpc: { chainId: this.chain.chainId, blockNumber: block.toString() },
      contracts: {
        payroll: process.env.CONFIDENTIAL_PAYROLL_ADDRESS,
        token: process.env.CONFIDENTIAL_TOKEN_ADDRESS,
      },
      relayer,
    };
  }
  @ApiEndpoint({
    summary: 'Get public Web3 configuration',
    description:
      'Returns the supported chain, public contract addresses, token metadata, and feature flags required by wallet clients.',
    response: PublicWeb3ConfigResponseDto,
    public: true,
  })
  @Public()
  @Get('config/public-web3')
  config() {
    return {
      chains: [{ chainId: this.chain.chainId, name: this.chain.chain.name }],
      contracts: {
        confidentialPayroll: getAddress(
          process.env.CONFIDENTIAL_PAYROLL_ADDRESS!,
        ),
        confidentialToken: getAddress(process.env.CONFIDENTIAL_TOKEN_ADDRESS!),
      },
      token: { symbol: 'ctUSDC', decimals: 6 },
      features: { nox: true, safe: true, testFaucet: true },
    };
  }
}
