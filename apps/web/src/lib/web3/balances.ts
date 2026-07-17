import {
  createPublicClient,
  erc20Abi,
  formatEther,
  formatUnits,
  http,
  type Address,
  type Chain,
} from 'viem';

import { getNetworkByKey, type NetworkOption } from '@/lib/web3/config';
import { isValidSafeAddress } from '@/lib/web3/safe';

const USDC_DECIMALS = 6;

export interface TokenBalance {
  symbol: string;
  address: string | null;
  raw: string;
  formatted: string;
  decimals: number;
}

export interface TreasuryBalances {
  safeAddress: string;
  network: NetworkOption;
  eth: TokenBalance;
  usdc: TokenBalance | null;
  fetchedAt: string;
}

function clientForChain(chain: Chain) {
  return createPublicClient({
    chain,
    transport: http(),
  });
}

function formatTokenAmount(value: string, maxFractionDigits = 6): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  });
}

export async function fetchTreasuryBalances(
  safeAddress: string,
  networkKey: string,
): Promise<TreasuryBalances> {
  if (!isValidSafeAddress(safeAddress)) {
    throw new Error('Invalid Safe address');
  }

  const network = getNetworkByKey(networkKey);
  if (!network) {
    throw new Error(`Unsupported network: ${networkKey}`);
  }

  const address = safeAddress as Address;
  const client = clientForChain(network.chain);

  const ethRaw = await client.getBalance({ address });
  const ethFormatted = formatEther(ethRaw);

  let usdc: TokenBalance | null = null;
  if (network.usdc) {
    try {
      const usdcRaw = await client.readContract({
        address: network.usdc as Address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      });
      const formatted = formatUnits(usdcRaw, USDC_DECIMALS);
      usdc = {
        symbol: 'USDC',
        address: network.usdc,
        raw: usdcRaw.toString(),
        formatted: formatTokenAmount(formatted, 6),
        decimals: USDC_DECIMALS,
      };
    } catch {
      usdc = {
        symbol: 'USDC',
        address: network.usdc,
        raw: '0',
        formatted: '0',
        decimals: USDC_DECIMALS,
      };
    }
  }

  return {
    safeAddress,
    network,
    eth: {
      symbol: network.chain.nativeCurrency.symbol || 'ETH',
      address: null,
      raw: ethRaw.toString(),
      formatted: formatTokenAmount(ethFormatted, 6),
      decimals: 18,
    },
    usdc,
    fetchedAt: new Date().toISOString(),
  };
}

export function hasUsdcCoverage(
  balances: TreasuryBalances | undefined,
  requiredUsdc: number,
): boolean {
  if (!balances?.usdc) return false;
  const available = Number(balances.usdc.formatted.replace(/,/g, ''));
  return Number.isFinite(available) && available >= requiredUsdc;
}

export function hasGasForExecution(
  balances: TreasuryBalances | undefined,
  minEth = 0.001,
): boolean {
  if (!balances?.eth) return false;
  const available = Number(balances.eth.formatted.replace(/,/g, ''));
  return Number.isFinite(available) && available >= minEth;
}
