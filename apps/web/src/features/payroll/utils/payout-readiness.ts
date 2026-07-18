import type { PayrollItem, PayrollPayoutReadiness } from '../types';

export function computePayoutReadiness(
  items: PayrollItem[] | undefined | null,
): PayrollPayoutReadiness {
  const list = items ?? [];
  let zeroPayCount = 0;
  let readyCount = 0;
  let missingWalletCount = 0;
  let payableNetPayCents = 0;
  const readyEmployeeNames: string[] = [];
  const missingWalletNames: string[] = [];

  for (const item of list) {
    if (item.netPayCents <= 0) {
      zeroPayCount += 1;
      continue;
    }
    payableNetPayCents += item.netPayCents;
    if (item.walletAddress) {
      readyCount += 1;
      readyEmployeeNames.push(item.employeeName);
    } else {
      missingWalletCount += 1;
      missingWalletNames.push(item.employeeName);
    }
  }

  return {
    itemCount: list.length,
    zeroPayCount,
    payableCount: readyCount + missingWalletCount,
    readyCount,
    missingWalletCount,
    payableNetPayCents,
    readyEmployeeNames,
    missingWalletNames,
  };
}

export function shortWallet(address: string | null | undefined): string {
  if (!address) return '';
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
