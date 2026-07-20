import hardhatToolboxViemPlugin from '@nomicfoundation/hardhat-toolbox-viem';
import { configVariable, defineConfig } from 'hardhat/config';

const sepoliaRpc =
  process.env.SEPOLIA_RPC_URL ||
  process.env.BLOCKCHAIN_RPC_URL ||
  'https://ethereum-sepolia-rpc.publicnode.com';

const sepoliaKey =
  process.env.SEPOLIA_PRIVATE_KEY ||
  process.env.NOX_PAYER_PRIVATE_KEY ||
  process.env.SAFE_OWNER_PRIVATE_KEY ||
  '';

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: '0.8.35',
        settings: {
          evmVersion: 'osaka',
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      production: {
        version: '0.8.35',
        settings: {
          evmVersion: 'osaka',
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
    npmFilesToBuild: [
      '@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol',
    ],
  },
  networks: {
    hardhatMainnet: {
      type: 'edr-simulated',
      chainType: 'l1',
    },
    hardhatOp: {
      type: 'edr-simulated',
      chainType: 'op',
    },
    sepolia: {
      type: 'http',
      chainType: 'l1',
      url: sepoliaRpc,
      ...(sepoliaKey
        ? {
            accounts: [
              sepoliaKey.startsWith('0x') ? sepoliaKey : `0x${sepoliaKey}`,
            ],
          }
        : {
            accounts: [configVariable('SEPOLIA_PRIVATE_KEY')],
          }),
    },
  },
});
