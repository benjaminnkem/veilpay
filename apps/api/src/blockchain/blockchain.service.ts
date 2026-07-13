import { Injectable } from '@nestjs/common';
import {
  createPublicClient,
  defineChain,
  http,
  type Address,
  type Hash,
} from 'viem';
import { ApiError } from '../common/api-error';

@Injectable()
export class BlockchainService {
  readonly chainId = Number(process.env.WEB3_CHAIN_ID);
  readonly chain = defineChain({
    id: this.chainId,
    name: `VeilPay chain ${this.chainId}`,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [process.env.WEB3_RPC_URL!] } },
  });
  readonly publicClient = createPublicClient({
    chain: this.chain,
    transport: http(process.env.WEB3_RPC_URL, { retryCount: 3 }),
  });
  async verifiedReceipt(hash: Hash) {
    const receipt = await this.publicClient.waitForTransactionReceipt({
      hash,
      confirmations: Number(process.env.WEB3_CONFIRMATIONS ?? 2),
      timeout: 120_000,
    });
    if (receipt.status !== 'success')
      throw new ApiError(
        'BLOCKCHAIN_TRANSACTION_REVERTED',
        'Transaction reverted',
      );
    return receipt;
  }
  async code(address: Address) {
    return this.publicClient.getCode({ address });
  }
  sanitize(error: unknown): string {
    return error instanceof Error ? error.name : 'BlockchainError';
  }
}
