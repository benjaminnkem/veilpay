# Codex tooling setup for this project

## Recommended minimum

You do not need many MCP servers. Too many tools can distract the agent and increase security exposure.

Use:

1. **Context7 MCP** for current NestJS, Prisma, viem, OpenZeppelin, Safe and other library documentation where indexed.
2. **The repo-scoped `nox-safe-payroll` skill** included in this pack for project-specific architecture, privacy and custody rules.
3. Codex’s normal local shell, repository search and test execution.

Nox is niche and may not be fully indexed by generic documentation MCPs. The skill therefore requires Codex to inspect current official Nox repositories, installed packages, package types and compiler behavior instead of guessing.

## Add Context7 to Codex CLI

Run from your terminal:

```bash
codex mcp add context7 -- npx -y @upstash/context7-mcp
```

Verify it:

```bash
codex mcp list
```

Inside the Codex terminal UI, use:

```text
/mcp
```

A project-scoped alternative is `.codex/config.toml`:

```toml
[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]
enabled = true
required = false
default_tools_approval_mode = "prompt"
```

Project-scoped MCP configuration is read only for trusted projects.

## Add the repo skill

Copy this directory into the repository root exactly as provided:

```text
.agents/
└── skills/
    └── nox-safe-payroll/
        └── SKILL.md
```

Codex automatically scans `.agents/skills` from the working directory up to the repository root.

Invoke it explicitly in Codex with:

```text
$nox-safe-payroll
```

You can also rely on its description to trigger automatically when working on Nox, Safe, payroll, ERC-7984 or confidential balances.

## Add the repository instructions

Place `AGENTS.md` in the Turborepo root. Codex should read it as repository-level guidance.

Also place:

```text
CONFIDENTIAL_PAYROLL_PRD.md
CODEX_ONE_SHOT_PROMPT.md
```

in the repository root.

Start Codex from the repository root so it can see the root instructions and skill.

## Optional tools

### GitHub MCP or GitHub integration

Useful only when Codex must search remote official Nox/Safe repositories, inspect issues, or create a pull request. It is not required when Codex already has the local repository and internet/documentation access.

Grant the smallest possible permissions. Read-only access is enough for documentation research. Do not expose organization-wide write permissions merely to build this project.

### Solidity security tools

These are normal development tools rather than MCP requirements:

- Slither for static analysis;
- Foundry fuzz/invariant tests when compatible with the existing contract app;
- Hardhat tests and Nox’s official local test tooling;
- OpenZeppelin contracts and current compiler warnings.

Ask Codex to use them only when compatible with the repository and Nox toolchain.

## Tools not recommended

Do not give an MCP server:

- wallet seed phrases;
- Safe owner private keys;
- production relayer private keys;
- production database credentials;
- unrestricted cloud or treasury write access.

Codex only needs local development secrets or testnet keys supplied through ignored `.env` files. Commit `.env.example`, never `.env`.

## Suggested launch sequence

From the Turborepo root:

```bash
codex mcp list
codex
```

Then paste the contents of `CODEX_ONE_SHOT_PROMPT.md`, or say:

```text
Use $nox-safe-payroll. Read CONFIDENTIAL_PAYROLL_PRD.md and execute CODEX_ONE_SHOT_PROMPT.md completely. Do not modify apps/web.
```
