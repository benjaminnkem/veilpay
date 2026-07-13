# Deployment

1. Install Node 22 or newer and pnpm 9, then run `pnpm install`.
2. Start PostgreSQL, create a database, copy `apps/api/.env.example` to `.env`, and replace every secret/zero address.
3. Run `pnpm --filter api prisma:migrate` and `pnpm --filter api prisma:generate`.
4. For local Nox, start Docker Desktop and run `pnpm --filter contracts test:nox`; otherwise deploy to a Nox-supported testnet.
5. Set `SEPOLIA_RPC_URL` and `SEPOLIA_PRIVATE_KEY` through the Hardhat keystore or contract `.env`, then run `pnpm --filter contracts deploy:sepolia`.
6. Read `apps/contracts/ignition/deployments/chain-11155111/deployed_addresses.json`. Set `CONFIDENTIAL_PAYROLL_ADDRESS` to `VeilPayPayrollModule#ConfidentialPayroll` and `CONFIDENTIAL_TOKEN_ADDRESS` to `VeilPayPayrollModule#TestConfidentialUSDC`. Restart the API.
7. Fund the deployer and separate relayer only with test ETH. Never use a Safe-owner key on the server.

The API starts with `pnpm --filter api start:dev`. Swagger is at `/docs`; liveness/readiness are `/health/live` and `/health/ready`.

The verified local chain-31337 deployment is recorded in `apps/contracts/deployments/31337.json`; its payroll, mock token, test confidential token, and confidential wrapper addresses are `0x5FbDB2315678afecb367f032d93F642f64180aa3`, `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`, `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`, and `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9` respectively. These deterministic local addresses are not testnet deployments.
