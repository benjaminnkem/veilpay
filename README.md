# VeilPay

**Confidential payroll for Web3 organizations** — HR sets pay, Finance/CEO approve, settlement runs on **Ethereum Sepolia** with:

- **Safe** as the open treasury (USDC + multi-sig-friendly execution)
- **iExec Nox** as the privacy layer (ERC-7984 encrypted amounts)

Built for the iExec **WTF (Write The Future)** hackathon: integrate Nox into real infrastructure without rewriting Safe or the payroll product surface.

| Layer | Stack |
| ----- | ----- |
| Web | Next.js App Router, Tailwind, wagmi / RainbowKit, TanStack Query |
| API | NestJS, TypeORM, PostgreSQL |
| Chain | Safe Protocol Kit, viem, `@iexec-nox/handle`, ERC-7984 wrapper |

**Feedback on Nox tools:** [feedback.md](./feedback.md)

---

## Pre-hackathon vs WTF work

### Already in place before the Nox-focused WTF work

- Full SaaS payroll domain: auth, orgs, employees, compensation, payroll drafts, HR → Finance → CEO approvals, audit, notifications, invitations
- Employee self-serve **payout wallet** (signed message)
- Organization **Safe** link + treasury balances UI
- **Public** on-chain rail: Safe multi-send of ERC-20 USDC (`BlockchainPaymentProvider`)
- Multi-employee payroll wizard / wallet readiness

### Built / hardened during this WTF integration

- **`NoxPaymentProvider`**: Sepolia confidential payroll via Nox handles + ERC-7984
- Hybrid settlement: **Safe wraps USDC → cToken to owner EOA**, then **EOA `confidentialTransfer`** to employees (Safe multi-send of confidential transfers hit opaque GS013)
- Local Hardhat deploy of **`WrappedSepoliaUSDC`** (`ERC20ToERC7984Wrapper`) — wizard was unreliable
- Org settings: execution mode `nox` + `confidentialTokenAddress`
- Employee **decrypt** + **unwrap to plain USDC** (Settings → Confidential payout)
- Always-wrap + wrapper supply checks so Safe USDC actually locks into cToken
- Longer HTTP timeout for execute; gateway lag handling for `publicDecrypt` / finalize unwrap
- This README dry-run, contracts README, [feedback.md](./feedback.md)

---

## Structure

```
veilpay/
├── apps/
│   ├── web/          # Next.js dashboard (port 3000)
│   ├── api/          # NestJS REST API (port 3001)
│   └── contracts/    # Hardhat 3 — wcUSDC wrapper deploy
├── packages/
│   ├── types/        # Shared domain types (@repo/types)
│   └── typescript-config/
├── docker-compose.yml
├── feedback.md       # iExec / Nox tool feedback (hackathon deliverable)
└── turbo.json
```

---

## Prerequisites

- Node.js **>= 22** (24 recommended for Nox packages)
- [pnpm](https://pnpm.io/) **9**
- Docker (Postgres) or local Postgres 16
- Sepolia ETH + Circle Sepolia USDC for demo wallets / Safe
- A Safe on Sepolia (1-of-1 is fine for demos) whose owner key you control

---

## Setup

```sh
pnpm install
docker compose up -d

cp apps/api/.env.example apps/api/.env
# edit apps/api/.env — at minimum DB + JWT; for Nox demo see below

# optional web env
# apps/web/.env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:3001
#   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
#   NEXT_PUBLIC_NOX_CTOKEN_ADDRESS=0x...   # optional fallback
```

### API env (Nox + Safe)

```env
BLOCKCHAIN_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
SAFE_OWNER_PRIVATE_KEY=0x...    # MetaMask key that owns the org Safe
NOX_CTOKEN_ADDRESS=0x...        # deployed WrappedSepoliaUSDC (or set only in UI)
# optional alias
# NOX_PAYER_PRIVATE_KEY=0x...
```

### Develop

```sh
pnpm dev
```

| App | URL |
| --- | --- |
| Web | http://localhost:3000 |
| API | http://localhost:3001 |
| Swagger | http://localhost:3001/docs |

Register an **OWNER** at `/register` (creates organization + settings).

---

## Sepolia dry-run (confidential payroll)

End-to-end path without mock data. Expect execute to take **1–2 minutes**.

### 1. Deploy the confidential USDC wrapper

```sh
export SEPOLIA_PRIVATE_KEY=0xYOUR_DEPLOYER_KEY   # needs Sepolia ETH
export SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

pnpm --filter contracts compile
pnpm --filter contracts deploy:wcusdc
```

Copy the printed **wcUSDC** address. Details: [apps/contracts/README.md](./apps/contracts/README.md).

Default underlying: Circle Sepolia USDC  
`0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`

### 2. Fund accounts

| Account | Needs |
| ------- | ----- |
| **Org Safe** | Payroll USDC + a little ETH (gas for wrap) |
| **Safe owner MetaMask** (`SAFE_OWNER_PRIVATE_KEY`) | Sepolia ETH (gas for confidential transfers) |
| **Employee MetaMask** | Sepolia ETH (decrypt / unwrap) |

### 3. Wire the org in the UI

1. Log in as OWNER / Finance.
2. **Settings → Treasury**: link Safe, network **sepolia**.
3. **Settings → Nox confidential payroll**:
   - Paste cToken (wcUSDC)
   - Mode: **Confidential Nox**
   - Save

Also set `NOX_CTOKEN_ADDRESS` + `SAFE_OWNER_PRIVATE_KEY` in `apps/api/.env` and restart the API.

### 4. People and pay

1. Create employees with compensation (or invite → onboard).
2. Each employee: **Settings → Payout wallet** → connect MetaMask → verify & save.
3. **Payroll → New run** → multi-employee draft → **Submit** → approve HR → Finance → CEO.

### 5. Execute (Nox)

On the approved payroll detail page:

1. Confirm rail shows **Nox ERC-7984**.
2. **Execute** (long-running).
3. Expect:
   - Safe USDC **decreases** by payroll total (locked in cToken)
   - Success message mentions wrap + encrypted transfers
   - Sepolia explorer: `confidentialTransfer` (amounts not public)

### 6. Employee decrypt / unwrap

Log in as the paid employee (or same browser with their wallet):

1. **Settings → Confidential payout (Nox)**
2. Connect the **linked payout wallet** on Sepolia
3. **Decrypt balance** → private amount via Nox ACL
4. **Unwrap all to USDC** → burn + wait for gateway + `finalizeUnwrap`
5. If finalize fails with gateway lag: wait and click **Finalize pending unwrap**
6. MetaMask should show plain Sepolia USDC

### Demo video outline (~4 min)

1. Problem: public chain leaks salaries  
2. Product: approve payroll in VeilPay  
3. Settlement: Safe wrap + Nox confidential transfer (explorer)  
4. Employee: decrypt + unwrap to USDC  
5. Close: Safe stays open infra; Nox hides amounts  

### Submission notes

- Tag **@iEx_ec** on X with demo video + public GitHub link  
- Include [feedback.md](./feedback.md)  
- Do not submit a prior Vibe Coding project unchanged; this repo’s Nox rail and employee unwrap were built for WTF (see section above)

---

## Architecture

### Payment rails

```ts
// apps/api/src/modules/payroll/providers/payment-provider.interface.ts
interface PaymentProvider {
  executePayroll(request): Promise<ExecutePayrollPaymentResult>;
}
```

| Provider | Behavior |
| -------- | -------- |
| `mock` | No chain movement |
| `blockchain` | Safe multi-send of **public** USDC |
| `nox` | Safe **wrap** USDC → cToken; owner EOA **confidentialTransfer**; amounts as Nox handles |

Nox path details: [apps/api/scripts/nox-setup.md](./apps/api/scripts/nox-setup.md).

### Roles

`SUPER_ADMIN` · `OWNER` · `HR` · `FINANCE` · `CEO` · `AUDITOR` · `EMPLOYEE`

---

## Scripts

```sh
pnpm build
pnpm lint
pnpm check-types
pnpm test
pnpm dev

pnpm --filter contracts compile
pnpm --filter contracts deploy:wcusdc
```

---

## Shared types

```ts
import type { Payroll, Employee, PaymentProviderKind } from '@repo/types';
```

---

## License / IP

Open-source monorepo for the hackathon submission. Respect third-party licenses for Safe, Nox (`@iexec-nox/*`), and OpenZeppelin packages.
