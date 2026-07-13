# VeilPay API

NestJS and PostgreSQL backend for confidential payroll. It owns authentication, tenant-scoped RBAC, wallet/SIWE verification, Safe deployment and proposal intents, encrypted salary records, Nox input preparation, exact payroll manifests, relayer execution, receipt reconciliation, audit logs, idempotency, and durable email jobs. It never stores Safe-owner keys or decrypts employee on-chain balances.

## Local setup

1. Copy `.env.example` to `.env` and replace every placeholder.
2. Create PostgreSQL databases for development and tests.
3. Run `pnpm --filter api prisma:generate` and `pnpm --filter api prisma:migrate`.
4. Start with `pnpm --filter api start:dev`. The interactive Swagger reference is at `/docs`, OpenAPI JSON at `/docs-json`, and OpenAPI YAML at `/docs-yaml`; API routes use `/api/v1` in the real server.

Every operation declares its request DTO, success response model, error envelope, authentication requirements, path/query parameters, and idempotency header where applicable. `test/openapi.e2e-spec.ts` enforces this contract during CI.

## Verification

```sh
pnpm --filter api lint
pnpm --filter api check-types
pnpm --filter api test
pnpm --filter api test:e2e
pnpm --filter api build
```

Critical POST endpoints require `Idempotency-Key`. `NOX_MODE=real` requires all real Nox and relayer configuration and never falls back to deterministic test handles. `NOX_MODE=test` is rejected in production.

See [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md), [`../../docs/ENVIRONMENT_VARIABLES.md`](../../docs/ENVIRONMENT_VARIABLES.md), and [`../../docs/WEB3_BEGINNER_TEST_GUIDE.md`](../../docs/WEB3_BEGINNER_TEST_GUIDE.md).
