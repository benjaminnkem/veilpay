import hardhatToolboxViemPlugin from '@nomicfoundation/hardhat-toolbox-viem';
import noxPlugin from '@iexec-nox/nox-hardhat-plugin';
import { configVariable, defineConfig } from 'hardhat/config';

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin, noxPlugin],
  nox: {
    skipTestOverride: process.env.NOX_E2E !== '1',
  },
  solidity: {
    profiles: {
      default: {
        version: '0.8.35',
        settings: {
          optimizer: { enabled: true, runs: 200 },
          viaIR: true,
        },
      },
      production: {
        version: '0.8.35',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
    },
  },
  networks: {
    default: {
      type: 'edr-simulated',
      chainType: 'op',
      chainId: 31337,
      allowUnlimitedContractSize: true,
    },
    hardhatMainnet: {
      type: 'edr-simulated',
      chainType: 'l1',
      allowUnlimitedContractSize: true,
    },
    hardhatOp: {
      type: 'edr-simulated',
      chainType: 'op',
    },
    localhost: {
      type: 'http',
      chainType: 'l1',
      url: 'http://127.0.0.1:8545',
    },
    sepolia: {
      type: 'http',
      chainType: 'l1',
      url: configVariable('SEPOLIA_RPC_URL'),
      accounts: [configVariable('SEPOLIA_PRIVATE_KEY')],
    },
  },
});
