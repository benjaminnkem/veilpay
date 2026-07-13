# VeilPay confidential payroll architecture

Each company has one 1-of-1 demo Safe owned by its verified company wallet. The API stores addresses and state, never owner keys. A separate relayer pays gas only for `ConfidentialPayroll.executePayroll`; the contract itself restricts execution to a Safe-approved exact manifest.

The Nest API is split into auth, wallets/SIWE, companies/RBAC, employees, Safe, Nox, payroll, blockchain, audit, durable jobs, and employee-portal modules. PostgreSQL is the durable source for orchestration, but finality transitions require receipts and direct contract reads. Safe Transaction Service is only a proposal/index service.

Payroll sequence:

1. HR snapshots active employees and AES-256-GCM salary envelopes into a DRAFT.
2. Preparation atomically claims the draft, briefly decrypts each salary in memory, converts it to integer 6-decimal base units, and calls the official Nox handle SDK. Proofs are bound to the payroll contract.
3. The API hashes the immutable ordered manifest and builds a Safe batch: bounded `setOperator` plus exact `approvePayroll`.
4. An owner signs and executes through their wallet. The API verifies the receipt and on-chain approval.
5. The relayer simulates and submits only `executePayroll`, then verifies the receipt, event, and final approval status.
6. Employees receive encrypted balance handles for wallet-authorized client-side decryption.

Public metadata includes addresses, timing, item count, and demo faucet amount. Salary values and balances remain encrypted.
