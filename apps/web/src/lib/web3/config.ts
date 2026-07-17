import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { base, baseSepolia, mainnet, sepolia } from 'wagmi/chains';

export const SUPPORTED_CHAINS = [sepolia, baseSepolia, base, mainnet] as const;

export type SupportedChainId = (typeof SUPPORTED_CHAINS)[number]['id'];

export const NETWORK_OPTIONS = [
  {
    id: sepolia.id,
    key: 'sepolia',
    name: 'Ethereum Sepolia',
    chain: sepolia,
    safeTxService: 'https://safe-transaction-sepolia.safe.global',
    explorer: 'https://sepolia.etherscan.io',
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  },
  {
    id: baseSepolia.id,
    key: 'base-sepolia',
    name: 'Base Sepolia',
    chain: baseSepolia,
    safeTxService: 'https://safe-transaction-base-sepolia.safe.global',
    explorer: 'https://sepolia.basescan.org',
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  },
  {
    id: base.id,
    key: 'base',
    name: 'Base',
    chain: base,
    safeTxService: 'https://safe-transaction-base.safe.global',
    explorer: 'https://basescan.org',
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  {
    id: mainnet.id,
    key: 'ethereum',
    name: 'Ethereum',
    chain: mainnet,
    safeTxService: 'https://safe-transaction-mainnet.safe.global',
    explorer: 'https://etherscan.io',
    usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  },
] as const;

export type NetworkOption = (typeof NETWORK_OPTIONS)[number];

export function getNetworkByKey(
  key?: string | null,
): NetworkOption | undefined {
  if (!key) return undefined;
  return NETWORK_OPTIONS.find(
    (n) => n.key === key || n.name.toLowerCase() === key.toLowerCase(),
  );
}

export function getNetworkByChainId(
  chainId?: number | null,
): NetworkOption | undefined {
  if (chainId == null) return undefined;
  return NETWORK_OPTIONS.find((n) => n.id === chainId);
}

export function getWalletConnectProjectId(): string {
  return process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() || '';
}

export const wagmiConfig = getDefaultConfig({
  appName: 'VeilPay',
  projectId: getWalletConnectProjectId() || '00000000000000000000000000000000',
  chains: [sepolia, baseSepolia, base, mainnet],
  transports: {
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [base.id]: http(),
    [mainnet.id]: http(),
  },
  ssr: true,
});

export const WEB3_READY = true;
