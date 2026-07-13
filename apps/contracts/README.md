# VeilPay contracts

Hardhat 3 contracts for Safe-approved confidential payroll using the official Nox ERC-7984 interfaces.

- `ConfidentialPayroll.sol` stores an exact Safe-scoped manifest approval, enforces expiry/cancellation/replay protection, and permissionlessly executes only the approved recipient/handle batch.
- `ConfidentialUSDC.sol` is the production confidential token wrapper.
- `TestConfidentialUSDC.sol` is a clearly test-only confidential faucet token.
- `MockUSDC.sol` supports the public local funding path.

## Commands

```sh
pnpm --filter contracts compile
pnpm --filter contracts test
pnpm --filter contracts test:nox       # requires a running Docker daemon
pnpm --filter contracts node
pnpm --filter contracts deploy:local
pnpm --filter contracts export:deployment
pnpm --filter contracts deploy:sepolia
```

The compact deployment record is written to `deployments/<chainId>.json`; Hardhat Ignition’s replayable journal remains in `ignition/deployments/chain-<chainId>/`. Real Nox mode never substitutes mocks.

See [`../../docs/CONTRACTS.md`](../../docs/CONTRACTS.md) and [`../../docs/DEPLOYMENT.md`](../../docs/DEPLOYMENT.md).
