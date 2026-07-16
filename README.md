# VeilPay

pnpm + Turborepo monorepo for **VeilPay** — an enterprise payroll platform for Web3 organizations.

The foundation is a complete SaaS payroll stack (auth, employees, compensation, payroll engine, approvals, audit, notifications, invitations). **Blockchain payment execution** (Safe, Nox, confidential USDC) plugs in later via the `PaymentProvider` abstraction.

## Structure

```
veilpay/
├── apps/
│   ├── web/          # Next.js App Router dashboard (port 3000)
│   ├── api/          # NestJS REST API (port 3001)
│   └── contracts/    # Hardhat 3 (future / sample)
├── packages/
│   ├── types/        # Shared domain types (@repo/types)
│   └── typescript-config/
├── docker-compose.yml  # PostgreSQL
└── turbo.json
```

## Prerequisites

- Node.js **>= 22**
- [pnpm](https://pnpm.io/) **9**
- Docker (for PostgreSQL) **or** a local Postgres 16 instance

## Setup

```sh
pnpm install

# Start Postgres
docker compose up -d

# API env (already has .env.example)
cp apps/api/.env.example apps/api/.env   # if needed
```

| Variable | Default | Notes |
| -------- | ------- | ----- |
| `DB_*` | `veilpay` / `localhost:5432` | TypeORM `DB_SYNC=true` in dev |
| `JWT_*` | dev secrets | Change in production |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Web client |
| `NEXTAUTH_SECRET` | dev fallback | Set for production |

## Develop

```sh
pnpm dev
```

| App | URL |
| --- | --- |
| Web | http://localhost:3000 |
| API | http://localhost:3001 |
| Swagger | http://localhost:3001/docs |

Register an **OWNER** account at `/register` (creates organization + settings). Then manage employees, compensation, payroll drafts, HR → Finance → CEO approvals, audit logs, and notifications.

## Architecture highlights

### Backend modules

Auth · Users · Organizations · Employees · Compensation · Payroll · Approvals · Audit logs · Notifications · Invitations · Settings

### Payroll vs payment rails

```ts
// apps/api/src/modules/payroll/providers/payment-provider.interface.ts
interface PaymentProvider {
  executePayroll(request): Promise<ExecutePayrollPaymentResult>;
}
```

- **MockPaymentProvider** — default (no funds moved)
- **BlockchainPaymentProvider** — stub for Safe / Nox / USDC (throws `NotImplemented`)

Payroll domain never depends on chain details. Fields like `safeAddress`, `walletAddress`, `transactionHash`, and `network` are nullable placeholders.

### Roles

`SUPER_ADMIN` · `OWNER` · `HR` · `FINANCE` · `CEO` · `AUDITOR` · `EMPLOYEE`

### Frontend

- Next.js App Router, Tailwind, shadcn/ui
- React Hook Form + Zod, TanStack Query, Axios feature services
- NextAuth credentials → JWT from Nest API
- Prepared (not wired): `wagmi`, `viem`, `@rainbow-me/rainbowkit` — see `apps/web/src/lib/web3/config.ts`

## Scripts

```sh
pnpm build
pnpm lint
pnpm check-types
pnpm test
pnpm dev:all    # includes contracts if configured
```

## Contracts (later)

```sh
pnpm --filter contracts compile
pnpm --filter contracts test
```

## Shared types

```ts
import type { Payroll, Employee, UserRole, PaymentProvider } from '@repo/types';
```
