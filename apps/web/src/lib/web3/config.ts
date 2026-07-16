/**
 * Future wallet / blockchain integration placeholders.
 *
 * Install is ready: wagmi, viem, @rainbow-me/rainbowkit.
 * Do not wire providers until Safe + Nox phase.
 *
 * Suggested integration points:
 * - providers/Web3Provider.tsx wrapping AppProviders
 * - features/auth/services/wallet-login.ts (SIWE / wallet auth)
 * - Organization.safeAddress + Payroll.transactionHash already on API
 */

export const WEB3_READY = false;

export const SUPPORTED_NETWORKS = [
  { id: 1, name: 'Ethereum Mainnet' },
  { id: 8453, name: 'Base' },
  { id: 11155111, name: 'Sepolia' },
] as const;

/** Placeholder chain config — populate when enabling wagmi */
export const web3Placeholder = {
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '',
  enabled: WEB3_READY,
} as const;
