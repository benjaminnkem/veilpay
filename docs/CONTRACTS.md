# Contracts and manifest

- `ConfidentialPayroll.sol`: Safe-scoped approval, cancellation, replay protection, expiry, duplicate-recipient rejection, exact-manifest execution, and official Nox ERC-7984 calls.
- `TestConfidentialUSDC.sol`: test-only official Nox ERC-7984 token with a capped public-amount faucet.
- `MockUSDC.sol` + `ConfidentialUSDC.sol`: alternative official wrapper demonstration.
- `PayrollManifest.sol`: canonical version 1 hashing.

Manifest v1 is `keccak256(abi.encode(uint16 version, uint256 chainId, address payrollContract, address token, address treasury, bytes32 payrollId, address[] recipients, bytes32[] handles, uint256 count, uint48 deadline))`. Order is significant. The shared vector is `0x0f914af5948c691e99b65b2fc6ca1deb508b751fa69a923cee83706717d60e54` and is asserted in Solidity and TypeScript tests.

Encrypted proofs must be created with `applicationContract = ConfidentialPayroll.address`. The ERC-7984 token calls Nox validation with its own `msg.sender`, which is the payroll contract.

Deploy with `pnpm --filter contracts deploy:local` or `pnpm --filter contracts deploy:sepolia`. Ignition writes deployment journals and `deployed_addresses.json` below `apps/contracts/ignition/deployments/chain-<chainId>/`; `export:deployment` writes the compact address/transaction record to `apps/contracts/deployments/<chainId>.json`. Copy the deployed `ConfidentialPayroll` and `TestConfidentialUSDC` addresses into the API environment. Verify with Hardhat's official `hardhat verify --network sepolia <address> [constructor args]`.
