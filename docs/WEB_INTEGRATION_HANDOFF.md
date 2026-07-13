# Web integration handoff

The untouched web client should use `/api/v1` and Bearer access tokens. Important wallet steps:

- `POST /wallets/challenge` with `{address,chainId}`, sign the exact returned SIWE `message`, then call `/wallets/verify`.
- Safe deployment intent returns `{intentId,chainId,predictedSafeAddress,transaction:{to,value,data}}`. Send exactly that transaction from the verified owner and submit its hash.
- Funding intent returns the same transaction shape. The demo faucet amount is public.
- Payroll safe-transaction returns `safeTxHash`, full Safe transaction data, and constituent calls. The owner signs the hash with `personal_sign`; submit `senderAddress` and `senderSignature` to `/propose`, then execute through Safe-compatible UX.
- Submit the on-chain Safe execution hash to `/sync-safe-approval`; only after `SAFE_APPROVED` call `/execute`.
- Employees request `/employee/confidential-balance-handle?companyId=...` and use `@iexec-nox/handle` with their wallet locally. Never send decrypted balances to the API.

Expected payroll states are `DRAFT -> PREPARING -> PREPARED -> PROPOSING -> PROPOSED -> SAFE_APPROVED -> EXECUTING -> EXECUTED`. Display stable API error `code` values, not raw RPC errors.
