import { authDelete, authGet, authPost } from '@/lib/api';
import type { Employee } from '@/features/employees/types';

export async function getMyEmployee(): Promise<Employee> {
  return authGet<Employee>('/employees/me');
}

export async function setMyPayoutWallet(payload: {
  walletAddress: string;
  signature: string;
  message: string;
  signedAt?: string;
}): Promise<Employee> {
  return authPost<Employee, typeof payload>('/employees/me/wallet', payload);
}

export async function clearMyPayoutWallet(): Promise<Employee> {
  return authDelete<Employee>('/employees/me/wallet');
}

export function buildPayoutWalletMessage(params: {
  appName?: string;
  email: string;
  employeeId: string;
  walletAddress: string;
  issuedAt: string;
}): string {
  const appName = params.appName ?? 'VeilPay';
  return [
    `${appName} payout wallet verification`,
    `Email: ${params.email}`,
    `Employee ID: ${params.employeeId}`,
    `Wallet: ${params.walletAddress}`,
    `Issued: ${params.issuedAt}`,
    '',
    'Sign this message to prove you control this wallet for payroll payouts.',
    'This does not move funds or approve any transaction.',
  ].join('\n');
}
