import type { Address } from 'viem';
import { isAddress } from 'viem';

import {
  getNetworkByChainId,
  getNetworkByKey,
  type NetworkOption,
} from '@/lib/web3/config';

export interface OwnerSafesResponse {
  safes: string[];
}

export async function fetchSafesForOwner(
  ownerAddress: string,
  network: NetworkOption,
): Promise<string[]> {
  if (!isAddress(ownerAddress)) {
    throw new Error('Invalid owner address');
  }

  const url = `${network.safeTxService}/api/v1/owners/${ownerAddress}/safes/`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      text ||
        `Failed to load Safes from Safe Transaction Service (${res.status})`,
    );
  }

  const data = (await res.json()) as OwnerSafesResponse;
  return (data.safes ?? []).filter((a) => isAddress(a));
}

export function resolveNetwork(
  chainId?: number | null,
  networkKey?: string | null,
): NetworkOption {
  return (
    getNetworkByChainId(chainId) ??
    getNetworkByKey(networkKey) ??
    getNetworkByKey('sepolia')!
  );
}

export function formatAddress(address: string, chars = 4): string {
  if (!isAddress(address)) return address;
  return `${address.slice(0, 2 + chars)}…${address.slice(-chars)}`;
}

export function safeExplorerUrl(
  network: NetworkOption,
  safeAddress: string,
): string {
  return `${network.explorer}/address/${safeAddress}`;
}

export function isValidSafeAddress(value: string): value is Address {
  return isAddress(value);
}
