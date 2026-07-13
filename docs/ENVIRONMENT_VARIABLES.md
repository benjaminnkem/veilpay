# Environment variables

Use `apps/api/.env.example` and `apps/contracts/.env.example` as the authoritative lists.

| Group      | Values                                         | Source / sensitivity                                                               |
| ---------- | ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| App        | `PORT`, `API_PREFIX`, URLs, CORS               | Deployment configuration; public                                                   |
| Database   | `DATABASE_URL`, `DIRECT_URL`                   | PostgreSQL provider; secret                                                        |
| Auth       | JWT/email/reset secrets and TTLs               | Generate with a cryptographic RNG; secret                                          |
| Encryption | `DATA_ENCRYPTION_KEY`, version                 | `openssl rand -hex 32`; highest-sensitivity secret                                 |
| Chain      | chain ID, RPC, confirmations, explorer         | Supported Nox network and RPC provider; RPC may contain a secret key               |
| Safe       | Transaction Service URL/API key                | Safe documentation/dashboard; API key secret                                       |
| Contracts  | payroll/token/mock addresses                   | Ignition deployment output; public                                                 |
| Nox        | mode, gateway, compute address, subgraph       | Official Nox network config. URLs/address are public unless provider-authenticated |
| Relayer    | `RELAYER_PRIVATE_KEY`                          | New test-only gas wallet; secret and never a Safe owner                            |
| Email      | provider/from and SMTP host/port/user/password | Console is development-only; SMTP credentials are secret                           |
| Deployment | Sepolia RPC/private key/Etherscan key          | Test deployer wallet/provider/explorer; secret                                     |

`NOX_MODE=test` is deterministic and only for local/unit tests. Production startup rejects it. `NOX_MODE=real` rejects incomplete configuration and never falls back.
