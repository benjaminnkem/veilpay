# VeilPay contracts

Hardhat 3 + viem. Includes a **Nox ERC-7984 wrapper** for Circle Sepolia USDC so VeilPay can run confidential payroll without the online wizard.

## Prerequisites

- Node.js **≥ 22** (Nox packages tested on 24)
- pnpm 9
- Sepolia ETH on the deployer key

## Install & compile

From monorepo root (or this package):

```sh
pnpm install
pnpm --filter contracts compile
```

Solidity **0.8.35** + `evmVersion: osaka` (required by `@iexec-nox/nox-protocol-contracts`). Hardhat also builds `Nox.sol` via `npmFilesToBuild`.

## Deploy ERC-20 → ERC-7984 wrapper (Sepolia)

1. Set env (copy `.env.example` or export inline):

```sh
export SEPOLIA_PRIVATE_KEY=0xYOUR_DEPLOYER_KEY
export SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
# optional; defaults to Circle Sepolia USDC
export SEPOLIA_USDC=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
```

`hardhat.config.ts` also accepts `NOX_PAYER_PRIVATE_KEY` / `SAFE_OWNER_PRIVATE_KEY` and `BLOCKCHAIN_RPC_URL`.

2. Deploy:

```sh
pnpm --filter contracts deploy:wcusdc
```

Or:

```sh
cd apps/contracts
pnpm deploy:wcusdc
```

3. Copy the printed `wcUSDC` address into:

- API: `NOX_CTOKEN_ADDRESS=0x...`
- Web: Organization settings → **Nox confidential payroll** → paste address → mode **Confidential Nox**

4. Fund the **Nox payer** EOA with Sepolia ETH + USDC. Payroll execute will `wrap` then `confidentialTransfer`.

## Contract

`contracts/WrappedSepoliaUSDC.sol` — thin subclass of:

`@iexec-nox/nox-confidential-contracts` → `ERC20ToERC7984Wrapper`

Constructor (matches current Nox package, not the older docs sketch):

```solidity
ERC20ToERC7984Wrapper(name, symbol, contractURI, underlying)
```

## Sample Counter

Legacy sample: `contracts/Counter.sol` + `pnpm deploy:local`.

## Nox references

| Item | Value |
| ---- | ----- |
| Chain | Ethereum Sepolia `11155111` |
| NoxCompute | `0x24ef36ec5b626d7dcd09a98f3083c2758f0f77bf` |
| Sepolia USDC | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |
| Packages | `@iexec-nox/nox-confidential-contracts@0.2.2`, `nox-protocol-contracts@0.2.4` |

See also `apps/api/scripts/nox-setup.md`.
