# Security and privacy

The backend never receives or stores a Safe-owner key or seed phrase. Company owners retain custody. The relayer is not an owner and its service has one allowed write path: exact approved payroll execution. Safe proposal status alone is insufficient; receipts, deployed bytecode, owners, threshold, approvals, operator permission, execution events, and final state are read from chain.

Salary envelopes use AES-256-GCM with a random 96-bit IV and associated data `companyId|employeeId|salary`. Refresh, invitation, verification, reset, and SIWE challenges are hashed or single-use. Company resources are tenant-bound and role checked. Logs and audit metadata omit salary plaintext, proofs, keys, tokens, and raw provider failures.

Limitations: employee and Safe addresses, token/contract relationships, timestamps, payroll item count, and gas are public. The test faucet also reveals its funding recipient and amount. Nox and the demo token are experimental testnet technology. Environment key storage should migrate to KMS envelope encryption in production, Safe thresholds should move to N-of-M, SMTP should replace the non-delivering console worker, and a third-party audit is required before real funds.
