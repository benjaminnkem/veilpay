# Confidential Payroll Infrastructure — Product Requirements Document

**Document status:** Implementation-ready  
**Primary audience:** Codex, backend engineers, smart-contract engineers  
**Repository shape:** Turborepo with `apps/web`, `apps/backend`, and `apps/contract`  
**Backend stack:** NestJS, Prisma, PostgreSQL  
**Blockchain stack:** Solidity, Nox confidential contracts, Safe Smart Accounts, EVM testnet  
**Default demo network:** Ethereum Sepolia unless the existing repository or current Nox support requires another supported testnet

---

## 1. Product summary

Build a non-custodial confidential payroll platform for companies that hold and distribute payroll funds on-chain.

Each company owns a dedicated Safe Smart Account. The platform never owns or controls the Safe owner keys. HR prepares payroll in the backend, salary values are encrypted, the exact payroll manifest is approved by the company Safe, and a dedicated confidential payroll contract transfers confidential tokens from the company Safe to employee wallets through Nox.

The product must demonstrate this end-to-end flow:

1. Admin signs up with email.
2. Admin connects and verifies a MetaMask-compatible wallet.
3. Admin creates a company.
4. The application prepares deployment of a dedicated 1-of-1 Safe for the demo.
5. Admin signs and broadcasts the Safe deployment transaction.
6. Admin funds the Safe with test confidential USDC.
7. Admin or HR invites employees.
8. Employees create accounts, accept invitations, connect wallets, and prove wallet ownership.
9. HR prepares a payroll run containing confidential salary amounts.
10. The backend prepares an exact encrypted payroll manifest.
11. The backend creates a Safe transaction proposal that approves the payroll manifest and grants only the required token operator permission.
12. The company admin signs and executes the Safe transaction.
13. The backend detects the approved on-chain transaction.
14. The backend relayer executes the already-approved confidential payroll.
15. Employees retrieve their confidential balance handles and decrypt balances client-side with their own wallets.

---

## 2. Problem statement

Normal ERC-20 payroll exposes:

- each employee wallet;
- each salary amount;
- bonuses and raises;
- company payroll totals and timing;
- treasury outflows;
- recurring compensation patterns.

This prevents privacy-conscious companies from using public blockchains for payroll.

The product adds confidential balances and transfers without taking custody of company funds and without modifying Safe itself.

---

## 3. Goals

### 3.1 Product goals

- Give every company a dedicated Safe treasury.
- Keep company funds under company-controlled wallet keys.
- Keep individual payroll amounts confidential on-chain.
- Keep plaintext salaries out of blockchain calldata, logs, and application logs.
- Let HR manage payroll through normal SaaS APIs.
- Require company authorization through Safe before payroll can execute.
- Let a backend relayer execute only a payroll that the Safe has already approved exactly.
- Let employees access their confidential balance handles without the backend decrypting balances.
- Provide a polished demo that can be tested by a beginner in Web3.

### 3.2 Engineering goals

- Production-style NestJS architecture.
- Strong tenant isolation.
- Explicit state machines for Safe deployment, wallet verification, invitations, and payroll.
- Idempotent blockchain operations.
- Verifiable on-chain receipts before database state transitions.
- Clear separation between signing, proposing, approval, execution, and indexing.
- Extensive unit, integration, contract, and end-to-end tests.
- Complete setup, environment, deployment, and beginner testing documentation.

---

## 4. Non-goals

The implementation must not:

- create a master Safe that holds all company funds;
- use internal database balances as a substitute for actual on-chain balances;
- store company Safe owner private keys;
- let the backend sign as a company Safe owner;
- decrypt employee confidential balances on the backend;
- expose salary plaintext in logs, events, error messages, traces, analytics, or URLs;
- build fiat on-ramping, KYC, tax filing, banking integrations, or production compliance workflows;
- build recurring salary streaming for the first release;
- claim recipient-address anonymity—wallet addresses and transaction relationships may remain visible;
- pretend that test tokens are production USDC.

---

## 5. Users and roles

### Platform user

A person with an email-authenticated account.

### Company owner

Creates the company, connects the first wallet, deploys the company Safe, and has all company permissions.

### Company admin

Manages members, settings, employees, treasury metadata, and payroll.

### HR

Invites and manages employees and creates/prepares payroll runs. HR cannot silently bypass Safe approval.

### Finance

Reviews payroll and Safe transaction status. In the demo, the owner may also perform this role.

### Employee

Accepts an invitation, verifies a wallet, and accesses their own payment history and confidential balance handle.

### Backend relayer

A gas-paying technical wallet. It is not a Safe owner and cannot spend arbitrary company funds. It can submit permissionless or narrowly authorized execution transactions after the company Safe has approved the exact payroll manifest.

---

## 6. Core custody model

Each company must have its own Safe address:

```text
Platform
├── Company A -> Safe A -> Company A confidential token balance
├── Company B -> Safe B -> Company B confidential token balance
└── Company C -> Safe C -> Company C confidential token balance
```

The platform database stores Safe addresses and metadata, not company funds.

For the hackathon demo:

- Safe owners: one verified admin wallet;
- Safe threshold: 1;
- deployment: user-signed;
- production-readiness note: support configurable N-of-M owners later.

---

## 7. Privacy model and guarantees

### Must remain confidential

- salary amounts;
- bonuses;
- per-employee payroll values;
- confidential token balances;
- sensitive salary values at rest in PostgreSQL.

### May remain public

- company Safe address;
- employee wallet addresses;
- token, payroll contract, and Safe interactions;
- transaction timestamps;
- employee count unless padding/batching is added later;
- demo faucet or wrapper funding amount, if the chosen funding mechanism exposes deposits.

### Required privacy rules

- Nox encrypted handles and proofs must be produced using the current official SDK pattern.
- Never invent Nox APIs. Inspect installed package types, official documentation, and official repositories.
- Never put plaintext salaries in contract method parameters.
- Never emit plaintext salaries.
- Never log decrypted salary values.
- Database salary fields must use authenticated encryption.
- Employee balance decryption must happen client-side and be authorized by the employee wallet.

---

## 8. High-level architecture

```text
Existing Web App
    |
    | REST API + wallet signatures + transaction hashes
    v
NestJS Backend
    ├── Authentication and invitations
    ├── Company and RBAC service
    ├── Wallet challenge/verification service
    ├── Safe orchestration service
    ├── Employee service
    ├── Payroll state machine
    ├── Nox encrypted input service
    ├── Blockchain RPC/indexing service
    ├── Relayer service
    ├── Email service
    ├── Audit service
    └── Prisma/PostgreSQL
              |
              | signed user transactions / relayed approved execution
              v
EVM Testnet
    ├── Company Safe
    ├── Mock underlying USDC or test funding contract
    ├── Confidential USDC/ERC-7984 token or wrapper
    └── ConfidentialPayroll contract
              |
              v
Nox confidential computation layer
```

---

## 9. Repository boundaries

Codex must first inspect the monorepo and follow its conventions.

### Allowed modifications

- `apps/backend/**`
- `apps/contract/**`
- `apps/web/**`
- shared packages only when required for backend/contract types or generated ABIs, and only if this matches existing repository conventions;
- root configuration only when necessary for scripts, workspace dependencies, linting, testing, or documentation;
- documentation files at repository root;
- `.agents/skills/**` and `.codex/**` when explicitly used for Codex configuration.

### Forbidden modifications

- Do not require the web app to import server-only secrets.

### Web integration contract

Backend endpoints must return everything the existing web app needs to:

- request wallet challenges;
- submit SIWE signatures;
- request Safe deployment transaction data;
- broadcast transactions through MetaMask;
- submit resulting transaction hashes;
- request Safe proposal signing payloads;
- submit Safe owner signatures;
- read status and errors;
- retrieve a confidential balance handle for client-side decryption.

Include DTO examples and OpenAPI documentation for all frontend-facing endpoints.

---

## 10. Required end-to-end user flows

## 10.1 Admin email signup

1. Admin submits name, email, and password.
2. Backend normalizes email and checks uniqueness.
3. Password is hashed using Argon2id or the repository’s existing secure password hashing standard.
4. Backend creates the user in an unverified or active state according to existing project conventions.
5. Backend sends an email verification token if email verification is enabled.
6. Backend issues short-lived access and rotating refresh tokens only after applicable verification rules.

Required supporting flows:

- sign in;
- refresh token rotation;
- sign out/revoke session;
- forgot password;
- reset password;
- email verification;
- current-user endpoint.

## 10.2 Wallet connection and verification

Wallet connection happens in the web app. Ownership verification happens in the backend.

1. Authenticated user requests a SIWE/EIP-4361 challenge.
2. Backend creates a cryptographically random one-time nonce with a short expiry.
3. Backend binds challenge to user, expected domain, URI, chain ID, statement, and nonce.
4. Web app asks MetaMask or another EIP-1193 wallet to sign the SIWE message.
5. Backend verifies message and signature.
6. Backend rejects replay, expired nonce, wrong domain, wrong chain, wrong user, malformed signature, and already-linked wallet conflicts.
7. Backend stores a normalized/checksummed wallet address and marks it verified.

A user may have multiple wallets, but one wallet should be selected as the active company-owner wallet for the demo.

## 10.3 Company creation

1. Verified user creates a company.
2. Backend creates Company and CompanyMember records transactionally.
3. Creator receives OWNER role.
4. Company is initially `SAFE_NOT_CONFIGURED`.
5. Company data is tenant-scoped.

## 10.4 Safe deployment

The backend must not deploy the Safe using a stored user private key.

1. Owner requests a Safe deployment intent.
2. Backend verifies:
   - requester is company owner/admin;
   - requester has a verified wallet;
   - wallet is intended owner;
   - company does not already have a deployed Safe;
   - requested chain is supported.
3. Backend uses current Safe Protocol Kit APIs to create or describe a predicted 1-of-1 Safe:
   - owners: `[verifiedAdminWallet]`;
   - threshold: `1`;
   - chain: configured testnet;
   - unique salt/nonce to avoid collisions.
4. Backend stores a SafeDeployment record containing predicted address and canonical deployment transaction data.
5. Backend returns `to`, `value`, `data`, `chainId`, predicted Safe address, and intent ID.
6. Web app asks the admin wallet to broadcast the transaction.
7. Web app sends the transaction hash to the backend.
8. Backend verifies receipt, network, deployed code, Safe address, owner list, and threshold on-chain.
9. Backend marks the Safe deployed and company treasury active.

All submission endpoints must be idempotent.

## 10.5 Funding with test confidential USDC

Implement a complete testnet funding path.

Preferred demo design:

- deploy a test confidential USD token based on the current official Nox ERC-7984 implementation;
- expose a clearly marked test-only faucet or test funding mechanism;
- mint/fund directly to a company Safe;
- rate-limit or cap faucet use where practical;
- document any public information leaked by the demo funding path.

Alternative acceptable design:

- deploy MockUSDC;
- deploy an ERC-20-to-ERC-7984 wrapper using the official Nox reference implementation;
- faucet MockUSDC;
- prepare a Safe batch to approve and deposit/wrap funds;
- verify the Safe’s resulting confidential balance handle.

The backend must expose:

- funding intent endpoint;
- transaction-hash confirmation endpoint;
- token and Safe balance-handle endpoints;
- verified funding status.

Do not fake funding by incrementing a database field.

## 10.6 Employee invitation and onboarding

1. OWNER, ADMIN, or HR creates an invitation with employee name and email.
2. Backend creates a high-entropy, single-use invitation token.
3. Store only a hash of the invitation token.
4. Set expiration and status.
5. Send invitation email through an abstract email provider.
6. Employee signs up or signs in.
7. Employee accepts invitation.
8. Backend creates/links CompanyMember with EMPLOYEE role and EmployeeProfile.
9. Employee verifies a wallet through the SIWE flow.
10. HR activates the employee only when required fields are complete.

Required employee fields:

- display name;
- email;
- wallet address after verification;
- employment status;
- salary currency/token;
- encrypted salary amount;
- pay frequency;
- optional start/end dates;
- timestamps.

## 10.7 Salary storage

Salary amounts must be encrypted before storage using authenticated encryption such as AES-256-GCM.

Requirements:

- 32-byte master encryption key from environment or secret manager;
- random IV/nonce per encrypted field;
- authentication tag;
- versioned ciphertext envelope;
- associated data including company ID, employee ID, and field purpose;
- encryption/decryption isolated in a dedicated service;
- no plaintext salary returned to users without an authorized HR/company scope;
- no plaintext salary in logs or audit payloads;
- tests for tampering and wrong associated data.

For the hackathon, an environment master key is acceptable. Document production migration to KMS/envelope encryption.

## 10.8 Payroll draft creation

1. HR selects eligible active employees or requests all active employees.
2. Backend creates PayrollRun in `DRAFT`.
3. Backend snapshots employee wallet addresses, salary ciphertext references, token, chain, and Safe address into PayrollItems.
4. Later employee changes must not silently mutate an existing payroll snapshot.
5. HR can update or remove items only while the payroll is DRAFT.
6. Backend computes a private plaintext total for authorized HR display only, but never writes the total to blockchain or logs.

## 10.9 Payroll preparation and encrypted manifest

1. HR requests prepare.
2. Backend acquires a database lock or performs an atomic state transition to avoid double preparation.
3. Backend validates:
   - company Safe deployed;
   - token and payroll contracts configured;
   - all employee wallets verified;
   - no duplicate recipients unless explicitly supported;
   - employee count within configured batch limit;
   - payroll is DRAFT;
   - salary amounts are positive and within token precision/range;
   - no stale or incomplete employee snapshots.
4. Backend decrypts salaries only in process memory for the shortest practical duration.
5. Backend converts salary decimal values into token base units safely without floating-point arithmetic.
6. Backend uses the current official Nox encrypted-input SDK to create encrypted amount handles/proofs that can be consumed by the intended contract call.
7. Backend stores encrypted handles, proofs, hashes, and metadata. It must not store plaintext salary.
8. Backend computes a canonical manifest hash covering at minimum:
   - chain ID;
   - payroll contract address;
   - confidential token address;
   - company Safe address;
   - unique payroll on-chain ID/nonce;
   - payroll database ID or deterministic bytes32 ID;
   - ordered recipient addresses;
   - ordered encrypted amount handles;
   - item count;
   - deadline/expiry;
   - manifest version.
9. The same canonical encoder must exist in backend tests and Solidity tests.
10. Backend transitions payroll to `PREPARED`.

The manifest must be immutable after preparation. Any change requires invalidation and a new preparation version.

## 10.10 Safe payroll proposal

The Safe must approve the exact prepared manifest.

The backend creates a Safe batch transaction containing the calls required by the final contract design, typically:

1. confidential token `setOperator(payrollContract, operatorExpiry)` from the company Safe;
2. payroll contract `approvePayroll(payrollId, manifestHash, token, itemCount, deadline)` from the company Safe.

Requirements:

- operator permission must be time-bounded;
- manifest deadline must be time-bounded;
- no permanent unlimited operator permission;
- payroll contract must not execute arbitrary calls;
- company Safe must be the approving treasury;
- batch data must be deterministic and stored;
- Safe transaction hash must be stored;
- backend returns the exact hash/payload the Safe owner must sign;
- backend never signs as Safe owner.

Proposal flow:

1. Backend builds the Safe transaction.
2. Backend returns transaction details and Safe transaction hash.
3. Web app requests the connected Safe owner to sign.
4. Web app submits owner signature and sender address.
5. Backend validates signer is a current Safe owner.
6. Backend proposes transaction to Safe Transaction Service using current Safe API Kit.
7. Backend marks payroll `PROPOSED`.
8. Admin executes the Safe transaction through Safe-compatible signing UX.
9. Backend polls or synchronizes transaction status and verifies on-chain receipt.
10. Backend reads payroll contract state and confirms the exact manifest is approved.
11. Backend marks payroll `SAFE_APPROVED`.

For a 1-of-1 demo, the first valid owner signature reaches threshold, but the on-chain Safe transaction still must be executed and verified.

## 10.11 Confidential payroll execution

1. Only a `SAFE_APPROVED` payroll can be executed.
2. Backend obtains a distributed/database lock and enforces idempotency.
3. Backend revalidates:
   - on-chain approval exists;
   - manifest hash matches;
   - not expired;
   - not cancelled;
   - not already executed;
   - correct Safe, token, chain, and contract;
   - token operator permission remains valid.
4. Backend relayer submits `executePayroll` with recipients, encrypted handles, proofs, and manifest fields.
5. Payroll contract recomputes the canonical hash and rejects mismatch.
6. Payroll contract marks payroll execution state before or safely during external calls to prevent replay.
7. Contract calls confidential token `confidentialTransferFrom` for each recipient using Nox-compatible encrypted amounts.
8. Contract emits events containing identifiers and encrypted handles only, never plaintext salary amounts.
9. Backend waits for confirmations and verifies contract events/state.
10. Backend marks PayrollRun `EXECUTED` and each PayrollItem `SUBMITTED` or equivalent.
11. Backend records transaction hash, block number, log index, and timestamps.

A permissionless `executePayroll` function is preferred when safe because the manifest is already exactly approved. The relayer then only pays gas and has no spending discretion.

## 10.12 Employee balance access

1. Authenticated employee requests their balance handle.
2. Backend verifies membership, employee profile, verified wallet, chain, and token.
3. Backend reads `confidentialBalanceOf(employeeWallet)` from the confidential token.
4. Backend returns encrypted handle and decryption metadata required by the current Nox client SDK.
5. Backend must not decrypt or return plaintext balance.
6. Web app will later use the employee wallet to authorize client-side decryption.

Also provide employee payment history based on PayrollItems and on-chain transaction metadata without plaintext salary unless the employee is authorized to see their own payroll amount through application-level encrypted data.

---

## 11. Smart contracts

Codex must inspect `apps/contract`, retain its existing framework when reasonable, and use current Nox packages and official patterns.

## 11.1 Required contracts

### `ConfidentialPayroll.sol`

Responsibilities:

- receive exact payroll approval from a company Safe;
- store approval keyed by treasury Safe and payroll ID;
- store manifest hash, token, item count, deadline, and status;
- cancel an approved but unexecuted payroll only when called by approving Safe;
- execute exact approved manifests;
- call ERC-7984 `confidentialTransferFrom` safely;
- prevent replay and duplicate execution;
- reject expired, unknown, cancelled, mismatched, malformed, empty, oversized, or duplicate-recipient payloads according to chosen policy;
- emit structured events without plaintext amounts.

Suggested status enum:

```text
NONE
APPROVED
EXECUTING
EXECUTED
CANCELLED
```

Suggested events:

```text
PayrollApproved(treasury, payrollId, manifestHash, token, itemCount, deadline)
PayrollCancelled(treasury, payrollId)
PayrollExecutionStarted(treasury, payrollId, manifestHash)
PayrollItemTransferred(treasury, payrollId, itemIndex, recipient, encryptedTransferredHandle)
PayrollExecuted(treasury, payrollId, manifestHash, itemCount)
```

Suggested custom errors:

```text
UnauthorizedTreasury
PayrollAlreadyExists
PayrollUnknown
PayrollExpired
PayrollCancelled
PayrollAlreadyExecuted
ManifestMismatch
InvalidToken
InvalidItemCount
InvalidRecipient
DuplicateRecipient
OperatorPermissionMissing
```

Use custom errors, checks-effects-interactions, explicit limits, and current Solidity security practices.

### Test confidential USD token

Provide a complete demo token/funding route using official Nox confidential token contracts.

Possible contracts:

- `MockUSDC.sol` and official-style confidential wrapper; or
- `TestConfidentialUSDC.sol` with a test-only faucet.

Clearly label test-only contracts and functions.

### Optional helper contracts

Add only when useful:

- funding faucet;
- manifest hashing library;
- interfaces;
- deployment configuration.

## 11.2 Contract invariants

- A Safe approval cannot be overwritten by another caller.
- A payroll ID cannot be executed twice.
- A manifest cannot change after approval.
- A cancelled payroll cannot execute.
- An expired payroll cannot execute.
- The item count must match approval.
- The token must match approval.
- The treasury must match approval.
- Plaintext amounts never enter payroll contract calldata.
- The contract cannot transfer to recipients outside the approved manifest.
- The backend relayer cannot select different amounts or recipients.
- Contract events do not reveal salary values.

## 11.3 Contract testing

Include:

- unit tests for every status transition and custom error;
- fuzz/property tests for manifest mismatch and replay prevention;
- tests for unauthorized approvals/cancellation;
- tests for expiry boundaries;
- tests for empty arrays and length mismatch;
- tests for max batch size;
- tests for duplicate recipients according to policy;
- tests for operator expiry;
- tests with the Nox local Hardhat environment or the current official testing approach;
- deployment smoke test;
- optional testnet integration test guarded by environment variables.

Run compiler, linter, formatter, and all tests.

---

## 12. Backend modules

Codex should adapt names to existing project conventions but implement equivalent responsibilities.

### `AuthModule`

- signup;
- email verification;
- login;
- refresh rotation;
- logout/revocation;
- forgot/reset password;
- guards and decorators.

### `UsersModule`

- profile;
- account status;
- safe user serialization.

### `WalletsModule`

- SIWE challenge;
- signature verification;
- wallet linking;
- wallet selection;
- unlink rules;
- nonce replay protection.

### `CompaniesModule`

- create/read/update company;
- member management;
- company context and tenant guard;
- role enforcement.

### `SafeModule`

- Safe deployment intents;
- deployment verification;
- Safe metadata synchronization;
- Safe transaction building;
- Safe proposal submission;
- Safe transaction polling/synchronization;
- current owner/threshold verification;
- Safe service API abstraction.

### `EmployeesModule`

- invite;
- accept invitation;
- employee CRUD;
- salary encryption;
- activation/deactivation;
- verified wallet requirement.

### `PayrollModule`

- drafts;
- payroll snapshots;
- preparation;
- canonical manifest hashing;
- Safe proposal state;
- on-chain approval synchronization;
- execution;
- payment history;
- retry and reconciliation.

### `NoxModule`

- current official Nox handle SDK adapter;
- encrypted input generation;
- handle/proof serialization;
- balance-handle reads;
- no plaintext logging;
- mock/local adapter only if needed for deterministic tests, clearly separated from real integration.

### `BlockchainModule`

- viem clients;
- supported chain registry;
- contract ABIs/addresses;
- receipt verification;
- event decoding;
- confirmation policy;
- RPC retry/backoff;
- chain mismatch detection.

### `RelayerModule`

- technical executor wallet;
- gas estimation;
- nonce management;
- transaction submission;
- receipt waiting;
- no Safe owner authority;
- explicit allowlist of callable contract/function;
- balance health endpoint.

### `EmailModule`

- provider interface;
- console provider for development;
- SMTP or existing provider implementation;
- invitation, verification, and reset templates.

### `AuditModule`

- append-only audit events;
- actor, company, action, resource, timestamp, IP/user-agent when available;
- redact secret and salary data.

### `HealthModule`

- liveness;
- readiness;
- database health;
- RPC health;
- configured-contract health;
- relayer gas health without exposing secret values.

---

## 13. Proposed Prisma data model

Codex must adapt to existing models and naming conventions. Preserve existing schema history.

### `User`

- `id`
- `email`
- `emailNormalized`
- `passwordHash`
- `name`
- `emailVerifiedAt`
- `status`
- timestamps

### `Session` or `RefreshToken`

- `id`
- `userId`
- hashed token/JTI
- expiry
- revokedAt
- replacement relationship or token family
- device metadata
- timestamps

### `Wallet`

- `id`
- `userId`
- `address`
- `chainType`
- `verifiedAt`
- `isPrimary`
- timestamps

Unique constraints must prevent one address from being linked to multiple users unless a deliberate shared-wallet design is implemented.

### `WalletChallenge`

- `id`
- `userId`
- `nonceHash` or nonce
- `message`
- `domain`
- `uri`
- `chainId`
- `expiresAt`
- `usedAt`
- timestamps

### `Company`

- `id`
- `name`
- `slug`
- `status`
- timestamps

### `CompanyMember`

- `id`
- `companyId`
- `userId`
- `role`
- `status`
- timestamps

Unique `(companyId, userId)`.

### `SafeAccount`

- `id`
- `companyId`
- `chainId`
- `address`
- `predictedAddress`
- `threshold`
- `status`
- `deploymentTxHash`
- `deployedAt`
- `lastSyncedAt`
- timestamps

Unique `(chainId, address)` and normally one active Safe per company/chain.

### `SafeDeploymentIntent`

- `id`
- `companyId`
- `walletId`
- `chainId`
- canonical `to`, `value`, `data`
- predicted address
- salt/nonce
- status
- txHash
- expiresAt
- timestamps

### `EmployeeInvitation`

- `id`
- `companyId`
- inviterUserId
- email/emailNormalized
- tokenHash
- role
- expiresAt
- acceptedAt
- revokedAt
- status
- timestamps

### `EmployeeProfile`

- `id`
- `companyId`
- `userId` nullable until accepted if needed
- `companyMemberId` nullable until accepted if needed
- display name
- email
- walletId nullable
- employment status
- encrypted salary envelope fields
- salary currency/token
- frequency
- startDate/endDate
- timestamps

### `PayrollRun`

- `id`
- `companyId`
- `safeAccountId`
- `chainId`
- `tokenAddress`
- `payrollContractAddress`
- human period/label
- `onchainPayrollId` bytes32/string
- `manifestVersion`
- `manifestHash`
- `status`
- `itemCount`
- `deadline`
- `safeTxHash`
- `safeExecutionTxHash`
- `executionTxHash`
- preparedAt/proposedAt/safeApprovedAt/executedAt/cancelledAt
- createdBy/updatedBy
- optimistic version
- timestamps

### `PayrollItem`

- `id`
- `payrollRunId`
- `employeeProfileId`
- ordered index
- recipient wallet snapshot
- encrypted salary snapshot/reference
- token base-unit metadata
- encrypted Nox handle
- Nox proof/ciphertext metadata as required
- handle hash
- transfer result handle
- status
- chain metadata
- timestamps

Unique `(payrollRunId, index)` and policy for duplicate recipient.

### `SafeTransactionProposal`

- `id`
- `payrollRunId`
- `safeAddress`
- `safeTxHash`
- canonical transaction JSON
- sender address
- sender signature
- service status
- confirmations required/received
- onchain txHash
- lastSyncedAt
- timestamps

### `BlockchainTransaction`

- `id`
- `companyId`
- related entity type/id
- chainId
- txHash
- from/to
- function name
- status
- block number/hash
- confirmations
- failure category and sanitized reason
- submittedAt/minedAt/finalizedAt
- timestamps

### `IdempotencyKey`

- key
- user/company scope
- operation
- request hash
- response status/body reference
- expiresAt
- timestamps

### `AuditLog`

- actor user/wallet
- company
- action
- resource type/id
- sanitized metadata JSON
- IP/user-agent
- timestamp

### `OutboxEvent` or durable job record

Use a PostgreSQL-backed outbox/job table if the project does not already use Redis/BullMQ. It should support email delivery, Safe status synchronization, receipt reconciliation, and retry with backoff.

---

## 14. Required state machines

## 14.1 Safe deployment

```text
CREATED
-> AWAITING_USER_SIGNATURE
-> SUBMITTED
-> CONFIRMED
-> VERIFIED

Failure/recovery:
EXPIRED | FAILED | REPLACED
```

## 14.2 Invitation

```text
PENDING -> ACCEPTED
PENDING -> EXPIRED
PENDING -> REVOKED
```

## 14.3 Payroll

```text
DRAFT
-> PREPARING
-> PREPARED
-> PROPOSING
-> PROPOSED
-> SAFE_APPROVED
-> EXECUTING
-> EXECUTED
```

Allowed side paths:

```text
DRAFT/PREPARED/PROPOSED/SAFE_APPROVED -> CANCELLED according to authorization rules
PREPARING/PROPOSING/EXECUTING -> FAILED_RETRYABLE or FAILED_FINAL
PREPARED -> EXPIRED
PROPOSED -> SAFE_REJECTED or EXPIRED
```

Define transitions in one service, validate them transactionally, and test invalid transitions.

---

## 15. API requirements

Use the project’s existing API versioning and response conventions. Otherwise use `/api/v1`.

## 15.1 Authentication

```text
POST   /api/v1/auth/signup
POST   /api/v1/auth/verify-email
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/me
```

## 15.2 Wallets

```text
POST   /api/v1/wallets/challenge
POST   /api/v1/wallets/verify
GET    /api/v1/wallets
PATCH  /api/v1/wallets/:walletId/primary
DELETE /api/v1/wallets/:walletId
```

## 15.3 Companies and members

```text
POST   /api/v1/companies
GET    /api/v1/companies
GET    /api/v1/companies/:companyId
PATCH  /api/v1/companies/:companyId
GET    /api/v1/companies/:companyId/members
PATCH  /api/v1/companies/:companyId/members/:memberId/role
```

## 15.4 Safe and funding

```text
POST   /api/v1/companies/:companyId/safe/deployment-intents
POST   /api/v1/companies/:companyId/safe/deployment-intents/:intentId/submit
POST   /api/v1/companies/:companyId/safe/sync
GET    /api/v1/companies/:companyId/safe
POST   /api/v1/companies/:companyId/treasury/funding-intents
POST   /api/v1/companies/:companyId/treasury/funding-intents/:intentId/submit
GET    /api/v1/companies/:companyId/treasury/balance-handle
```

## 15.5 Invitations and employees

```text
POST   /api/v1/companies/:companyId/invitations
GET    /api/v1/companies/:companyId/invitations
POST   /api/v1/invitations/accept
POST   /api/v1/companies/:companyId/invitations/:invitationId/revoke
GET    /api/v1/companies/:companyId/employees
GET    /api/v1/companies/:companyId/employees/:employeeId
PATCH  /api/v1/companies/:companyId/employees/:employeeId
POST   /api/v1/companies/:companyId/employees/:employeeId/activate
POST   /api/v1/companies/:companyId/employees/:employeeId/deactivate
```

## 15.6 Payroll

```text
POST   /api/v1/companies/:companyId/payroll-runs
GET    /api/v1/companies/:companyId/payroll-runs
GET    /api/v1/companies/:companyId/payroll-runs/:payrollId
PATCH  /api/v1/companies/:companyId/payroll-runs/:payrollId
POST   /api/v1/companies/:companyId/payroll-runs/:payrollId/prepare
POST   /api/v1/companies/:companyId/payroll-runs/:payrollId/safe-transaction
POST   /api/v1/companies/:companyId/payroll-runs/:payrollId/propose
POST   /api/v1/companies/:companyId/payroll-runs/:payrollId/sync-safe-approval
POST   /api/v1/companies/:companyId/payroll-runs/:payrollId/execute
POST   /api/v1/companies/:companyId/payroll-runs/:payrollId/cancel
POST   /api/v1/companies/:companyId/payroll-runs/:payrollId/reconcile
```

## 15.7 Employee portal APIs

```text
GET    /api/v1/employee/companies
GET    /api/v1/employee/payments
GET    /api/v1/employee/confidential-balance-handle
```

## 15.8 System APIs

```text
GET    /health/live
GET    /health/ready
GET    /api/v1/config/public-web3
```

`public-web3` should expose safe public values only: supported chain IDs, RPC-safe chain metadata, contract addresses, token symbol/decimals, and feature flags. It must never expose private keys or private provider credentials.

---

## 16. Authentication and authorization

- Use JWT access tokens and secure refresh token rotation unless repository conventions differ.
- Hash stored refresh tokens.
- Use RBAC guards and company membership checks.
- Every company-scoped query must include `companyId` authorization.
- Never trust a company ID from request body without guard validation.
- Employee endpoints must only expose the current employee’s records.
- Require verified wallet for Safe deployment and employee payment activation.
- Verify current Safe owners from chain before accepting proposal signatures.
- Rate-limit auth, wallet challenge, invitation, and transaction endpoints.

Role matrix minimum:

| Action                            |                                                            OWNER |    ADMIN |   HR |  FINANCE | EMPLOYEE |
| --------------------------------- | ---------------------------------------------------------------: | -------: | ---: | -------: | -------: |
| Create company                    |                                                              Yes |      N/A |  N/A |      N/A |       No |
| Deploy Safe                       |                                                              Yes | Optional |   No | Optional |       No |
| Invite employee                   |                                                              Yes |      Yes |  Yes |       No |       No |
| Edit salary                       |                                                              Yes |      Yes |  Yes |       No |       No |
| Create payroll                    |                                                              Yes |      Yes |  Yes | Optional |       No |
| Prepare payroll                   |                                                              Yes |      Yes |  Yes | Optional |       No |
| Build proposal                    |                                                              Yes |      Yes |  Yes |      Yes |       No |
| Sign Safe transaction             |                                Only if current Safe owner wallet |     Same | Same |     Same |       No |
| Execute approved payroll endpoint | Authorized company role; contract itself enforces exact approval |          |      |          |       No |
| View own balance handle           |                                          No unless also employee |          |      |          |      Yes |

---

## 17. Safe integration rules

- Use current `@safe-global/protocol-kit`, `@safe-global/api-kit`, and related official packages compatible with the repository.
- Pin exact compatible versions after successful installation.
- Do not copy stale examples blindly; compile against installed type definitions.
- Backend may build transaction data and submit owner-signed proposals.
- Backend must not hold Safe owner private keys.
- Backend must verify sender signature/address and current Safe ownership.
- Store canonical Safe transaction payload and hash.
- Support Safe Transaction Service URL/API key configuration.
- Verify final Safe execution on-chain, not only service status.
- Treat Safe service as an index/proposal service, not the source of final truth.

---

## 18. Nox integration rules

- Use current official `@iexec-nox` packages and official repositories.
- Inspect package exports and type declarations before implementing.
- Use the official encrypted input proof flow.
- Ensure encrypted inputs are authorized/bound for the exact consuming caller/contract according to current Nox semantics.
- Use supported chain addresses/configuration from official packages or documented configuration, never guessed addresses.
- Store handles/proofs in binary-safe formats.
- Validate serialization round trips.
- Provide a local testing adapter only where official Nox local tooling requires it.
- Real mode must not silently fall back to mock encryption.
- Fail startup in real mode when Nox configuration is missing.
- Document Nox privacy limitations and any test-token limitations.

---

## 19. Blockchain and relayer rules

- Use viem unless the existing contract/backend uses ethers consistently.
- Maintain one configured public client per supported chain.
- Use a dedicated relayer private key only for approved payroll execution and optional harmless test faucet calls.
- Never use relayer as company Safe owner.
- Restrict relayer service to allowed chain IDs, contract addresses, and function selectors.
- Use pending nonce management and transaction replacement strategy.
- Sanitize RPC errors.
- Store transaction lifecycle records.
- Require configurable confirmation depth.
- Reconcile dropped/replaced/reverted transactions.
- Make execution endpoint idempotent.

---

## 20. Error handling

Use structured errors with stable codes, for example:

```text
AUTH_INVALID_CREDENTIALS
WALLET_CHALLENGE_EXPIRED
WALLET_SIGNATURE_INVALID
WALLET_ALREADY_LINKED
COMPANY_ACCESS_DENIED
SAFE_ALREADY_CONFIGURED
SAFE_DEPLOYMENT_NOT_CONFIRMED
SAFE_OWNER_MISMATCH
SAFE_TRANSACTION_NOT_EXECUTED
EMPLOYEE_WALLET_REQUIRED
PAYROLL_INVALID_STATE
PAYROLL_MANIFEST_MISMATCH
PAYROLL_EXPIRED
PAYROLL_ALREADY_EXECUTED
NOX_ENCRYPTION_FAILED
BLOCKCHAIN_TRANSACTION_REVERTED
RELAYER_INSUFFICIENT_GAS
```

Do not expose stack traces, secrets, decrypted salaries, private RPC URLs, or raw provider errors in production responses.

---

## 21. Idempotency and concurrency

Require `Idempotency-Key` for externally triggered state-changing operations involving:

- company creation where duplicate retries matter;
- Safe deployment intent creation/submission;
- funding intent submission;
- invitation sending;
- payroll preparation;
- Safe proposal submission;
- payroll execution.

Use:

- request hash comparison;
- unique database constraints;
- Prisma transactions;
- optimistic version columns or row locking strategy;
- one active execution attempt per payroll;
- deterministic on-chain payroll ID;
- replay protection in Solidity.

---

## 22. Observability and audit

- Structured logs with request ID, user ID, company ID, payroll ID, chain ID, and transaction hash.
- Never log passwords, tokens, signatures beyond necessary sanitized identifiers, salary plaintext, encryption keys, proofs when sensitive, or private keys.
- Append-only audit logs for security-sensitive actions.
- Metrics or counters for signup, wallet verification, invitations, payroll states, RPC failures, Safe proposal failures, and relayer failures.
- Health checks for database, RPC, configured contracts, and relayer gas.

---

## 23. Required tests

## 23.1 Backend unit tests

- auth and token rotation;
- SIWE challenge creation, replay, expiry, wrong domain/chain, and signature verification;
- company RBAC and tenant isolation;
- salary encryption/decryption/tamper detection;
- decimal-to-base-unit conversion;
- canonical manifest hashing;
- payroll state machine;
- idempotency behavior;
- Safe payload building;
- Safe signature owner checks;
- relayer allowlist;
- error redaction.

## 23.2 Backend integration/e2e tests

- signup -> login -> wallet verification;
- create company;
- create Safe deployment intent;
- confirm deployment using mock/local chain adapter;
- invite and accept employee;
- create/update employee salary;
- create and prepare payroll;
- create Safe proposal payload;
- sync Safe approval;
- execute payroll;
- retrieve employee balance handle;
- cross-tenant access denial;
- duplicate request/idempotency retries.

Use Testcontainers or the repository’s existing PostgreSQL test strategy where possible.

## 23.3 Contract tests

See Section 11.3.

## 23.4 Full integration test

Provide one script or test that runs the complete happy path on local Nox-compatible chain or testnet when secrets are present.

The script must create or use:

- admin account;
- admin wallet;
- company;
- 1-of-1 Safe;
- test funds;
- two or more employees;
- prepared confidential payroll;
- Safe approval;
- payroll execution;
- balance handles.

It must skip gracefully with explicit instructions when testnet environment variables are absent.

---

## 24. Seed data

Provide a development seed that creates application records only and does not pretend blockchain state exists.

Where practical, include scripts to:

- deploy contracts locally/testnet;
- output deployment addresses into machine-readable JSON;
- sync ABI/address artifacts to backend using the monorepo’s preferred shared package or generated file pattern;
- create demo users/company/employees after blockchain configuration.

Never commit real private keys.

---

## 25. Environment configuration

Codex must create complete `.env.example` files for backend and contract apps, preserving existing variables.

Expected categories:

### Backend application

```text
NODE_ENV
PORT
API_PREFIX
APP_URL
WEB_APP_URL
CORS_ORIGINS
```

### Database

```text
DATABASE_URL
DIRECT_URL if required by hosting provider
```

### Authentication

```text
JWT_ACCESS_SECRET
JWT_ACCESS_TTL
JWT_REFRESH_SECRET
JWT_REFRESH_TTL
EMAIL_VERIFICATION_SECRET
PASSWORD_RESET_SECRET
```

### Field encryption

```text
DATA_ENCRYPTION_KEY
DATA_ENCRYPTION_KEY_VERSION
```

### Email

```text
EMAIL_PROVIDER
EMAIL_FROM
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD
or the existing provider’s variables
```

### Blockchain

```text
WEB3_CHAIN_ID
WEB3_RPC_URL
WEB3_CONFIRMATIONS
WEB3_BLOCK_EXPLORER_URL
RELAYER_PRIVATE_KEY
```

### Safe

```text
SAFE_TRANSACTION_SERVICE_URL
SAFE_API_KEY if required
SAFE_VERSION or deployment configuration only if necessary
```

### Contracts

```text
CONFIDENTIAL_PAYROLL_ADDRESS
CONFIDENTIAL_TOKEN_ADDRESS
MOCK_USDC_ADDRESS if used
CONFIDENTIAL_WRAPPER_ADDRESS if used
FAUCET_ADDRESS if used
```

### Nox

Use the exact environment variables required by the installed current Nox SDK. Do not invent names. Document each variable and where to obtain it.

### Contract deployment

```text
DEPLOYER_PRIVATE_KEY
SEPOLIA_RPC_URL or configured supported network RPC
BLOCK_EXPLORER_API_KEY if verification is implemented
```

`.env.example` must contain safe placeholders and comments, never real credentials.

---

## 26. Documentation deliverables

Codex must produce or update:

1. `README.md` or app READMEs with architecture and commands.
2. `apps/backend/.env.example`.
3. `apps/contract/.env.example`.
4. Prisma migration(s).
5. OpenAPI/Swagger endpoint documentation.
6. `docs/ARCHITECTURE.md`.
7. `docs/CONTRACTS.md`.
8. `docs/DEPLOYMENT.md`.
9. `docs/SECURITY_AND_PRIVACY.md`.
10. `docs/WEB_INTEGRATION_HANDOFF.md` describing exact payloads the untouched web app must implement.
11. `docs/WEB3_BEGINNER_TEST_GUIDE.md` with copy-paste commands and expected results.
12. `docs/ENVIRONMENT_VARIABLES.md` listing every environment variable, whether required, where to get it, and whether it is public or secret.
13. `docs/IMPLEMENTATION_SUMMARY.md` listing what was built, tradeoffs, limitations, migrations, contracts, and remaining optional improvements.

---

## 27. Beginner Web3 testing guide requirements

The guide must assume the reader understands normal web development but is new to Web3.

It must explain:

- what a wallet is;
- which wallet is the company Safe owner;
- what the relayer wallet is and why it cannot control the Safe;
- how to add/select the test network in MetaMask;
- how to obtain test gas from an official faucet without sharing private keys;
- how to deploy contracts;
- how to record deployed addresses in environment variables;
- how to start PostgreSQL, backend, and contract/local node;
- how to run Prisma migrations and seeds;
- how to sign a SIWE message;
- how to create a company;
- how to request and broadcast a Safe deployment transaction;
- how to verify the Safe address and owner;
- how to fund the Safe with test confidential tokens;
- how to invite two employees;
- how to verify employee wallets;
- how to prepare payroll;
- how to sign and execute the Safe transaction;
- how to execute the confidential payroll;
- how to query transaction status;
- how to retrieve and decrypt an employee balance client-side or through an official sample script;
- expected API responses and status transitions;
- common failures and fixes;
- how to reset/redeploy local development state.

Include both:

- automated test commands;
- manual API flow using curl, Bruno, Postman collection, or an included HTTP file.

Never ask the beginner to paste a real wallet seed phrase or production private key.

---

## 28. Security requirements

- No Safe owner private keys on backend.
- No seed phrases anywhere.
- Relayer key loaded only from secrets/environment.
- Restrict relayer actions.
- Argon2id password hashing.
- Refresh-token rotation and revocation.
- SIWE nonce replay protection.
- Strong invitation/reset token generation and hashing.
- AES-256-GCM authenticated salary encryption.
- Tenant-scoped authorization on all company resources.
- Rate limiting and validation.
- Prisma parameterized access only.
- Secrets redaction.
- Contract reentrancy/replay/expiry/authorization protections.
- Dependency audit and Solidity static analysis where available.
- Explicit test-only contract warnings.
- No silent real-to-mock fallback.

---

## 29. Performance and operational constraints

- Default demo maximum payroll size: configurable, suggested 20 recipients per transaction until gas profiling proves a higher safe limit.
- Use pagination for employee and payroll lists.
- Use PostgreSQL indexes for tenant/status/time queries.
- Do not keep HTTP requests open while waiting indefinitely for blockchain finality; return transaction state and support sync/reconcile endpoints.
- Use retry with exponential backoff for RPC, email, and Safe Transaction Service.
- Use durable state so a backend restart does not lose execution progress.

---

## 30. Acceptance criteria

The feature is complete only when all of the following are true:

- Backend and contract apps install with the repository package manager.
- Prisma schema validates and migrations apply to PostgreSQL.
- Backend builds, lints, and tests successfully.
- Contracts compile, lint/format, deploy locally, and tests pass.
- Current official Nox APIs are used; no invented placeholders remain.
- Safe deployment intent is user-signable and on-chain verifiable.
- A company has its own 1-of-1 Safe.
- Test confidential token funds are actually associated with the Safe on-chain.
- Employee invitation and wallet-verification flow works.
- Salary is encrypted at rest.
- Payroll preparation generates real Nox encrypted inputs in real mode.
- Safe proposal contains the exact manifest approval and bounded operator authorization.
- Backend does not sign as the Safe owner.
- Backend detects on-chain Safe approval.
- Relayer executes the exact approved confidential payroll.
- Contract prevents changed recipients/handles, replay, expiry, and cancellation bypass.
- Employees can retrieve confidential balance handles.
- No plaintext salary appears in blockchain calldata/events or application logs.
- `.env.example` files are complete.
- Beginner testing documentation can reproduce the full flow.
- `apps/web` is unchanged.
- Codex reports every command run and any remaining externally blocked operation.

---

## 31. Required implementation decisions

Codex should make safe, documented decisions rather than stopping for normal ambiguity.

Use these defaults:

- Ethereum Sepolia where currently supported by Nox and Safe;
- 1-of-1 Safe for demo;
- one confidential USD token per deployment;
- permissionless exact-manifest payroll execution where feasible;
- time-bounded operator permission;
- deterministic bytes32 payroll ID;
- PostgreSQL-backed durable jobs/outbox unless Redis already exists;
- viem for EVM backend access unless existing code strongly standardizes on ethers;
- Swagger/OpenAPI;
- DTO validation;
- UTC timestamps;
- integer token base units only;
- batch limit of 20, configurable;
- app-level AES-256-GCM salary encryption;
- client-side employee balance decryption.

Any deviation must be explained in `docs/IMPLEMENTATION_SUMMARY.md`.

---

## 32. Source-of-truth policy

When implementation examples conflict, use this priority:

1. Installed package type definitions and compiler behavior.
2. Current official Nox documentation and official `iExec-Nox` repositories.
3. Current official Safe documentation and Safe repositories.
4. Current NestJS, Prisma, viem, and OpenZeppelin documentation.
5. Existing repository conventions.
6. This PRD.

Never guess a Web3 API merely to make TypeScript compile. Build, test, and verify the real integration.
