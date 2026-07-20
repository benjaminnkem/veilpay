export interface ChainNetworkConfig {
  key: string;
  chainId: number;
  name: string;
  rpcUrl: string;
  usdcAddress: string;
  usdcDecimals: number;
  safeTxServiceUrl: string;
  explorerUrl: string;
}

const DEFAULT_RPC: Record<string, string> = {
  sepolia: 'https://ethereum-sepolia-rpc.publicnode.com',
  'base-sepolia': 'https://sepolia.base.org',
  base: 'https://mainnet.base.org',
  ethereum: 'https://ethereum-rpc.publicnode.com',
};

export function resolveNetworkConfig(
  networkKey?: string | null,
  rpcOverride?: string | null,
): ChainNetworkConfig {
  const key = (networkKey ?? 'sepolia').toLowerCase().trim();

  const table: Record<string, Omit<ChainNetworkConfig, 'rpcUrl'>> = {
    sepolia: {
      key: 'sepolia',
      chainId: 11155111,
      name: 'Ethereum Sepolia',
      usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      usdcDecimals: 6,
      safeTxServiceUrl: 'https://safe-transaction-sepolia.safe.global',
      explorerUrl: 'https://sepolia.etherscan.io',
    },
    'base-sepolia': {
      key: 'base-sepolia',
      chainId: 84532,
      name: 'Base Sepolia',
      usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      usdcDecimals: 6,
      safeTxServiceUrl: 'https://safe-transaction-base-sepolia.safe.global',
      explorerUrl: 'https://sepolia.basescan.org',
    },
    base: {
      key: 'base',
      chainId: 8453,
      name: 'Base',
      usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      usdcDecimals: 6,
      safeTxServiceUrl: 'https://safe-transaction-base.safe.global',
      explorerUrl: 'https://basescan.org',
    },
    ethereum: {
      key: 'ethereum',
      chainId: 1,
      name: 'Ethereum',
      usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      usdcDecimals: 6,
      safeTxServiceUrl: 'https://safe-transaction-mainnet.safe.global',
      explorerUrl: 'https://etherscan.io',
    },
  };

  const base = table[key];
  if (!base) {
    throw new Error(
      `Unsupported network "${networkKey}". Use sepolia, base-sepolia, base, or ethereum.`,
    );
  }

  return {
    ...base,
    rpcUrl:
      rpcOverride?.trim() ||
      DEFAULT_RPC[key] ||
      DEFAULT_RPC.sepolia ||
      'https://ethereum-sepolia-rpc.publicnode.com',
  };
}

/** Convert integer USD cents → USDC base units (6 decimals). */
export function centsToUsdcBaseUnits(
  amountCents: number,
  usdcDecimals = 6,
): bigint {
  if (!Number.isFinite(amountCents) || amountCents < 0) {
    throw new Error(`Invalid amount cents: ${amountCents}`);
  }
  const cents = BigInt(Math.round(amountCents));
  // 1 cent = 10^(usdcDecimals - 2) base units when USDC has 6 decimals → * 10^4
  const factor = 10n ** BigInt(usdcDecimals - 2);
  return cents * factor;
}
