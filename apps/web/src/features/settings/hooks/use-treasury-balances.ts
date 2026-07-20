'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchTreasuryBalances } from '@/lib/web3/balances';
import { isValidSafeAddress } from '@/lib/web3/safe';

export const treasuryBalancesQueryKey = (
  safeAddress?: string | null,
  network?: string | null,
) => ['treasury-balances', safeAddress, network] as const;

export function useTreasuryBalances(
  safeAddress?: string | null,
  network?: string | null,
) {
  return useQuery({
    queryKey: treasuryBalancesQueryKey(safeAddress, network),
    queryFn: () => fetchTreasuryBalances(safeAddress!, network!),
    enabled: Boolean(
      safeAddress &&
      network &&
      isValidSafeAddress(safeAddress) &&
      network.length > 0,
    ),
    staleTime: 15_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}
