import { network } from 'hardhat';
import { getAddress, isAddress, type Address } from 'viem';

/**
 * Deploy WrappedSepoliaUSDC (ERC-20 → ERC-7984) on Sepolia.
 *
 * Usage:
 *   SEPOLIA_PRIVATE_KEY=0x... pnpm --filter contracts deploy:wcusdc
 *
 * Optional:
 *   SEPOLIA_USDC=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
 *   SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
 */
const DEFAULT_SEPOLIA_USDC =
  '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as const;

async function main() {
  const connection = await network.connect();
  const { viem } = connection;

  const publicClient = await viem.getPublicClient();
  const [walletClient] = await viem.getWalletClients();

  if (!walletClient?.account) {
    throw new Error(
      'No deployer account. Set SEPOLIA_PRIVATE_KEY (or NOX_PAYER_PRIVATE_KEY / SAFE_OWNER_PRIVATE_KEY).',
    );
  }

  const chainId = await publicClient.getChainId();
  const deployer = walletClient.account.address;

  const usdcRaw =
    process.env.SEPOLIA_USDC?.trim() ||
    process.env.USDC_ADDRESS?.trim() ||
    DEFAULT_SEPOLIA_USDC;

  if (!isAddress(usdcRaw)) {
    throw new Error(`Invalid USDC address: ${usdcRaw}`);
  }
  const usdc = getAddress(usdcRaw) as Address;

  console.log('Network chainId:', chainId);
  console.log('Deployer:', deployer);
  console.log('Underlying USDC:', usdc);

  if (chainId === 11155111) {
    console.log('Target: Ethereum Sepolia (NoxCompute is pre-deployed)');
  } else {
    console.warn(
      'Warning: NoxCompute is only configured for Sepolia (11155111) and Arbitrum Sepolia in the Nox SDK. This chain may not work for confidential ops.',
    );
  }

  const balance = await publicClient.getBalance({ address: deployer });
  console.log('Deployer ETH balance (wei):', balance.toString());
  if (balance === 0n) {
    throw new Error(
      'Deployer has 0 ETH. Fund the account with Sepolia ETH first.',
    );
  }

  const code = await publicClient.getCode({ address: usdc });
  if (!code || code === '0x') {
    throw new Error(`No contract code at underlying address ${usdc}`);
  }

  console.log('Deploying WrappedSepoliaUSDC…');
  const token = await viem.deployContract('WrappedSepoliaUSDC', [usdc]);
  const address = getAddress(token.address);

  const name = await token.read.name();
  const symbol = await token.read.symbol();
  const decimals = await token.read.decimals();
  const underlying = await token.read.underlying();

  console.log('');
  console.log('=== Deployed ===');
  console.log('wcUSDC (confidential wrapper):', address);
  console.log('name:', name);
  console.log('symbol:', symbol);
  console.log('decimals:', decimals);
  console.log('underlying():', underlying);
  console.log('');
  console.log('Next steps:');
  console.log(`  1. Set API env:  NOX_CTOKEN_ADDRESS=${address}`);
  console.log(
    '  2. Org settings → Nox card → paste address → mode Confidential Nox',
  );
  console.log(
    '  3. Fund payer with Sepolia USDC; execute payroll (API will wrap + confidentialTransfer)',
  );
  console.log(`  4. Explorer: https://sepolia.etherscan.io/address/${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
