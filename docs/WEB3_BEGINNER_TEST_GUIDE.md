# Beginner local and testnet test guide

A wallet is an account whose private key stays in MetaMask. The admin wallet owns the company Safe. The relayer is a different test wallet that only pays execution gas and cannot control the Safe. Never paste a seed phrase into this project.

## Automated checks

```bash
pnpm install
pnpm --filter api prisma:validate
pnpm --filter api test
pnpm --filter contracts test
pnpm build
pnpm lint
pnpm check-types
```

For real local Nox, start Docker Desktop, confirm `docker info`, then run `pnpm --filter contracts test:nox`. Without Docker/Nox services this intentionally fails instead of using a mock.

## Manual flow

Start PostgreSQL, migrate, start a local/testnet chain, deploy contracts, fill API `.env`, then start the API. Import the selected testnet into MetaMask using its official chain ID/RPC and obtain test ETH from the network's official faucet. Do not use mainnet funds.

Use Swagger or curl. First sign up, retrieve the verification link through the configured email provider, verify, login, and set `TOKEN` from `accessToken`:

```bash
curl -X POST localhost:3001/api/v1/auth/signup -H 'content-type: application/json' -d '{"name":"Admin","email":"admin@example.test","password":"correct-horse-battery-staple"}'
curl -X POST localhost:3001/api/v1/auth/login -H 'content-type: application/json' -d '{"email":"admin@example.test","password":"correct-horse-battery-staple"}'
curl -X POST localhost:3001/api/v1/companies -H "authorization: Bearer $TOKEN" -H 'idempotency-key: create-demo-company-1' -H 'content-type: application/json' -d '{"name":"Demo Co"}'
```

Request `/wallets/challenge`, sign its exact message in MetaMask, and verify. Create a Safe deployment intent, send its exact `to/value/data`, then submit the receipt hash. Call Safe sync and confirm one owner and threshold one. Create a treasury funding intent using integer base units such as `10000000000`, broadcast it, submit its hash, and confirm a nonzero encrypted balance handle. Send a new stable `Idempotency-Key` on every critical POST; reuse the same key only when retrying the identical body.

Invite two unique employee emails. Each employee signs up/verifies email, accepts their one-time token, verifies a different wallet, then HR sets salary decimal strings and activates them. Create a payroll, prepare it, build the Safe transaction, sign/propose/execute it with the Safe owner, submit the Safe execution hash, and call execute. Poll GET payroll until `EXECUTED`.

Finally, each employee calls the balance-handle endpoint and decrypts locally with the official Nox handle client and their connected wallet. Common failures: wrong SIWE domain/chain, expired nonce, reused token, unfunded gas wallet, stopped Docker, missing operator expiry, or stale contract addresses. Reset local app state by dropping/recreating only the local database and deleting local Ignition deployment output before redeploying; never do this to shared/testnet state.
