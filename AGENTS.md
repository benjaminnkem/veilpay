# Repository instructions for Codex

## Required context

Read `CONFIDENTIAL_PAYROLL_PRD.md` before implementing confidential payroll work.

## Architecture invariants

- One Safe per company.
- Company wallet owners retain custody.
- Backend never stores Safe owner keys or seed phrases.
- Relayer only pays gas for exact approved payroll execution.
- Salary values are encrypted at rest and confidential on-chain.
- Employee balances are decrypted client-side, never by the backend.
- Real Nox mode must never fall back silently to mocks.
- Verify final blockchain state and receipts; do not trust database or indexer status alone.

## Engineering rules

- Inspect repository conventions before changes.
- Use the existing package manager and test stack.
- Use installed SDK types and current official documentation; do not guess Nox or Safe APIs.
- Preserve tenant isolation and enforce RBAC on every company-scoped operation.
- Use integer base units for token amounts.
- Use idempotency and explicit state machines for blockchain operations.
- Never log plaintext salary, keys, tokens, seed phrases or sensitive proofs.
- Run build, lint, typecheck and tests and fix failures.
- Document externally blocked testnet steps honestly.
