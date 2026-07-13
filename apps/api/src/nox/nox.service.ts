import { createHash } from 'node:crypto';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { createViemHandleClient, type HandleClient } from '@iexec-nox/handle';
import { createWalletClient, http, type Address, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ApiError } from '../common/api-error';

export interface PreparedInput {
  handle: Hex;
  proof: Hex;
}

@Injectable()
export class NoxService implements OnModuleInit {
  private client?: HandleClient;
  constructor(private readonly chain: BlockchainService) {}
  async onModuleInit(): Promise<void> {
    if (process.env.NOX_MODE === 'test') return;
    try {
      const account = privateKeyToAccount(
        process.env.RELAYER_PRIVATE_KEY as Hex,
      );
      const wallet = createWalletClient({
        account,
        chain: this.chain.chain,
        transport: http(process.env.WEB3_RPC_URL),
      });
      this.client = await createViemHandleClient(wallet, {
        gatewayUrl: process.env.NOX_GATEWAY_URL as
          `http://${string}` | `https://${string}`,
        smartContractAddress: process.env.NOX_COMPUTE_ADDRESS as Address,
        subgraphUrl: process.env.NOX_SUBGRAPH_URL as
          `http://${string}` | `https://${string}`,
      });
    } catch {
      throw new Error(
        'NOX real mode initialization failed; no mock fallback is permitted',
      );
    }
  }
  async encryptAmount(
    amount: bigint,
    applicationContract: Address,
  ): Promise<PreparedInput> {
    if (amount <= 0n)
      throw new ApiError(
        'NOX_ENCRYPTION_FAILED',
        'Encrypted amount must be positive',
      );
    if (process.env.NOX_MODE === 'test') {
      if (process.env.NODE_ENV === 'production')
        throw new Error('Nox test adapter cannot run in production');
      const digest = createHash('sha256')
        .update(
          `veilpay-test|${this.chain.chainId}|${applicationContract}|${amount}`,
        )
        .digest('hex');
      return {
        handle: `0x${digest}`,
        proof: `0x${createHash('sha256').update(`proof|${digest}`).digest('hex')}`,
      };
    }
    if (!this.client)
      throw new ApiError('NOX_ENCRYPTION_FAILED', 'Nox client is unavailable');
    try {
      const result = await this.client.encryptInput(
        amount,
        'uint256',
        applicationContract,
      );
      return { handle: result.handle, proof: result.handleProof };
    } catch (err) {
      console.error('Nox input preparation failed', err);
      throw new ApiError(
        'NOX_ENCRYPTION_FAILED',
        'Nox input preparation failed',
      );
    }
  }
}
