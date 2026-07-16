export const WEB3_READY = false;

export const SUPPORTED_NETWORKS = [
  { id: 1, name: 'Ethereum Mainnet' },
  { id: 8453, name: 'Base' },
  { id: 11155111, name: 'Sepolia' },
] as const;

export const web3Placeholder = {
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '',
  enabled: WEB3_READY,
} as const;
