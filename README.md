# VeilPay

pnpm + Turborepo monorepo for VeilPay: Next.js web app, NestJS API, Hardhat smart contracts, and shared TypeScript packages.

## Structure

```
veilpay/
├── apps/
│   ├── web/          # Next.js frontend (port 3000)
│   ├── api/          # NestJS API (port 3001)
│   └── contracts/    # Hardhat 3 smart contracts
├── packages/
│   ├── types/        # Shared domain types (@repo/types)
│   └── typescript-config/  # Shared TSConfigs (@repo/typescript-config)
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Prerequisites

- Node.js **>= 22**
- [pnpm](https://pnpm.io/) **9** (`corepack enable` then `corepack prepare pnpm@9.0.0 --activate`)

## Setup

```sh
pnpm install
```

## Develop

Run web + API together:

```sh
pnpm dev
```

| App | URL                   |
| --- | --------------------- |
| Web | http://localhost:3000 |
| API | http://localhost:3001 |

Filter a single package:

```sh
pnpm exec turbo dev --filter=web
pnpm exec turbo dev --filter=api
pnpm exec turbo dev --filter=contracts
```

## Build / lint / types / test

```sh
pnpm build
pnpm lint
pnpm check-types
pnpm test
```

## Contracts (Hardhat 3)

App lives at `apps/contracts` (same workspace pattern as `web` and `api`).

```sh
# Compile
pnpm exec turbo build --filter=contracts
# or
pnpm --filter contracts compile

# Test (Solidity + TypeScript/viem)
pnpm --filter contracts test

# Local node
pnpm --filter contracts node

# Deploy the VeilPay payroll suite via Ignition (local)
pnpm --filter contracts deploy:local
```

The confidential-payroll backend and contract implementation is documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/IMPLEMENTATION_SUMMARY.md`](docs/IMPLEMENTATION_SUMMARY.md), and the [`beginner test guide`](docs/WEB3_BEGINNER_TEST_GUIDE.md). The API uses PostgreSQL; copy `apps/api/.env.example`, then run `pnpm --filter api prisma:generate` and `pnpm --filter api prisma:migrate` before starting it. Real local Nox E2E requires Docker Desktop and runs with `pnpm --filter contracts test:nox`.

Optional Sepolia vars (or use `hardhat keystore set …`):

```sh
cp apps/contracts/.env.example apps/contracts/.env
```

## Shared packages

### `@repo/types`

Domain types (`Company`, `Employee`, `PayrollRun`, …). Import as types:

```ts
import type { Company, PayrollRun } from '@repo/types';
```

### `@repo/typescript-config`

Shared TSConfigs:

- `base.json`
- `nextjs.json`
- `nestjs.json`
- `hardhat.json`

Extend in each package:

```json
{
  "extends": "@repo/typescript-config/nextjs.json"
}
```

## Turbo notes

- `build` depends on `^build` so shared packages compile first.
- `dev` is uncached and persistent.
- Root `pnpm dev` only starts **web** and **api** (not the Hardhat node). Use `pnpm dev:all` to include every package with a `dev` script.
