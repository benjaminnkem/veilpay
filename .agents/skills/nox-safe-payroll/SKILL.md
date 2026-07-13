---
name: nox-safe-payroll
description: Build or review the NestJS, Prisma, Safe Smart Account, Solidity and Nox ERC-7984 confidential payroll implementation in this repository. Trigger for payroll, Safe deployment/proposals, Nox encrypted inputs, ERC-7984 transfers, manifest hashing, relayer execution, or confidential balances. Do not trigger for unrelated frontend work.
---

# Nox + Safe confidential payroll skill

Read the repository `./docs/VEILPAY_PRD.md` and `AGENTS.md` first.

## Scope

Work on `apps/backend`, `apps/contract` and `apps/web`

## Source discipline

Nox and Safe evolve quickly. Before writing integration code:

1. Inspect installed package versions, exports and TypeScript/Solidity types.
2. Consult current official Nox documentation and official `iExec-Nox` repositories.
3. Consult current official Safe Protocol Kit and API Kit documentation.
4. Compile against the real packages.
5. Pin compatible exact versions only after compilation succeeds.

Never invent:

- Nox contract addresses;
- encrypted-handle formats;
- proof construction APIs;
- ACL/authorization semantics;
- Safe transaction-service methods;
- Safe deployment data;
- ERC-7984 function signatures.

## Custody invariants

- Every company has a dedicated Safe.
- The company’s verified wallet is the Safe owner for the 1-of-1 demo.
- Backend must not store or use the Safe owner private key.
- Backend may prepare transaction data and submit an owner-signed proposal.
- Relayer must not be a Safe owner.
- Relayer may execute only the exact manifest that the Safe approved.

## Privacy invariants

- Plaintext salaries never enter blockchain calldata or events.
- Plaintext salaries never enter logs, audit metadata or error responses.
- Salary storage uses authenticated encryption and associated data.
- Confidential balance decryption is client-side and wallet-authorized.
- Real mode cannot silently use mock encrypted handles.
- Document that wallet addresses, timing and some funding metadata may remain public.

## Contract workflow

Use the following conceptual flow, adjusted only when current official APIs require it:

1. Backend prepares encrypted amount handles/proofs.
2. Backend computes canonical manifest hash.
3. Safe batch grants time-bounded token operator permission to payroll contract.
4. Safe calls payroll contract to approve exact manifest.
5. Safe transaction is signed/executed by company owner.
6. Backend verifies on-chain approval.
7. Permissionless or narrowly authorized relayer calls `executePayroll`.
8. Contract recomputes manifest and calls ERC-7984 `confidentialTransferFrom`.
9. Contract prevents replay and emits encrypted identifiers only.

Ensure the Nox input proof is generated for the actual consuming caller/contract under current ACL semantics.

## Backend workflow

- SIWE nonce challenge and replay protection.
- Company tenant/RBAC guards.
- User-signable Safe deployment intent.
- On-chain Safe owner/threshold verification.
- Secure invitations and wallet verification.
- AES-256-GCM salary storage.
- Immutable payroll snapshot.
- Nox preparation adapter.
- Deterministic Safe transaction and manifest.
- Owner signature verification and Safe service proposal.
- On-chain Safe execution sync.
- Idempotent relayer execution.
- Employee confidential balance-handle endpoint.
- Durable reconciliation jobs.

## Testing checklist

Run and fix:

- Prisma validation and migrations;
- Nest build/typecheck/lint/tests;
- contract compile/lint/tests;
- manifest cross-language vectors;
- Safe deployment/proposal adapter tests;
- Nox encrypted-input adapter tests using official local tools or explicit test doubles;
- full happy-path integration test;
- cross-tenant and authorization tests;
- replay, expiry, cancellation and idempotency tests.

## Completion output

Always provide:

- changed-file summary;
- commands and results;
- `.env` variables and where to obtain them;
- deployed-address update instructions;
- beginner local/testnet test flow;
- remaining limitations and externally blocked actions.
