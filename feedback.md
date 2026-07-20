# Feedback on iExec Nox / WTF tools

Project: **VeilPay** — confidential org payroll on Ethereum Sepolia using Safe as open treasury infrastructure and **Nox** as the privacy layer for pay amounts.

Track: iExec **WTF (Write The Future)** — integrate Nox into real infrastructure (Safe + payroll SaaS) without rewriting those systems.

---

## What we built with Nox

| Piece | Usage |
| ----- | ----- |
| `@iexec-nox/handle` (JS SDK) | `encryptInput`, `decrypt`, `publicDecrypt` |
| `@iexec-nox/nox-confidential-contracts` | ERC-7984 + `ERC20ToERC7984Wrapper` |
| `@iexec-nox/nox-protocol-contracts` | NoxCompute on Sepolia (pre-deployed) |
| Gateway | `https://gateway-testnets.noxprotocol.dev` |
| Network | Ethereum Sepolia (`11155111`) |
| NoxCompute | `0x24ef36ec5b626d7dcd09a98f3083c2758f0f77bf` |

**Product flow**

1. Org links a **Safe** (USDC + ETH) and a deployed **wcUSDC** wrapper.
2. On execute: Safe **wraps** payroll USDC into confidential cToken (credited to owner EOA).
3. Owner EOA sends **`confidentialTransfer`** per employee (encrypted amounts).
4. Employee **decrypts** private balance and **unwraps** (burn → `publicDecrypt` proof → `finalizeUnwrap` → plain USDC).

This keeps Safe as composable public treasury infra and adds privacy at settlement, matching the hackathon “build on open protocols without modifying them” theme.

---

## What worked well

1. **ERC-7984 + wrapper model is the right abstraction for payroll**  
   Wrap public USDC → hold/transfer encrypted balances → unwrap back to ERC-20 is easy to explain to judges and to product users.

2. **`@iexec-nox/handle` API is small and usable**  
   `encryptInput(value, type, appContract)`, `decrypt(handle)`, and `publicDecrypt(handle)` cover the full loop once you know ACL rules (viewer vs public).

3. **Sepolia NoxCompute is already deployed**  
   We only had to deploy our wrapper, not the whole protocol. Good for a hackathon timeline.

4. **Local Hardhat compile against published packages**  
   Pinning solc **0.8.35** + `evmVersion: osaka` + `npmFilesToBuild: Nox.sol` matched official Nox repos and avoided fighting the online contracts wizard.

5. **ConfidentialTransfer is visible as a method on explorers without leaking amounts**  
   Strong demo moment: “tx exists, salary not public.”

6. **Docs repo markdown (GitHub) is more complete than the SPA docs site**  
   Architecture, handle layout, and ERC-7984 guides in `iExec-Nox/documentation` were enough to implement when the rendered site was sparse.

---

## Pain points and rough edges

### 1. Online Contracts Wizard

- Flaky / no reliable “deploy to Sepolia” path for us.
- Docs constructor examples for `ERC20ToERC7984Wrapper` were **out of date** (older `(underlying)` style vs current `(name, symbol, contractURI, underlying)`).
- **Workaround:** deploy with Hardhat from this monorepo (`pnpm --filter contracts deploy:wcusdc`).

### 2. Safe + confidentialTransfer in one multi-send

- Running `confidentialTransfer` **from the Safe** (multi-send) consistently failed with Safe **GS013** (generic inner revert).
- GS013 hides the real ERC-7984 / Nox reason, which slows debugging a lot.
- **Workaround (hybrid rail):** Safe only does `approve` + `wrap(to: owner EOA)`; owner EOA does encrypt + `confidentialTransfer`. USDC still leaves the Safe; Nox pays stay EOA-signed.

### 3. Gateway lag on public decrypt (unwrap finalize)

- After `unwrap`, on-chain `isPubliclyDecryptable(handle)` can be **true** while  
  `GET /v0/public/{handle}` still returns **403 `access_denied: not publicly decryptable`**.
- Private `decrypt` as viewer often works earlier than `publicDecrypt`.
- **Workaround:** poll on-chain public flag → wait until private decrypt works → retry publicDecrypt with long backoff → then `finalizeUnwrap`. UI also has **Finalize pending unwrap**.

### 4. Gas estimation / viem + public RPC

- Failed `eth_estimateGas` sometimes returns **null**, surface as  
  `Cannot destructure property 'gasLimit' of ... null` instead of a Solidity error.
- **Workaround:** `simulateContract` first, then fixed `gas` fallback on write.

### 5. “Silent” zero / skip semantics

- ERC-7984 can leave a non-zero **handle** even when UX expects “no balance yet.”
- Skipping wrap because a handle already existed made it look like payroll “succeeded” without Safe USDC moving.
- **Workaround:** always wrap the payroll amount and assert `inferredTotalSupply` increases.

### 6. User mental model

- Employees see **no MetaMask USDC** after confidential pay until unwrap.
- Needs product copy + a decrypt/unwrap screen (we added Settings → Confidential payout).

### 7. Long-running execute

- Wrap + encrypt + N transfers can exceed a 30s HTTP client timeout.
- **Workaround:** payroll execute timeout raised to 180s; shorter wait loops where safe.

### 8. Docs / product surface

- Rendered docs at docs.noxprotocol.io often incomplete (“under development”).
- Linktree + GitHub READMEs + package source were more reliable than the hosted site alone.
- Hardhat Nox plugin docs emphasize Docker off-chain stack for **local tests**; for Sepolia we only needed published packages + gateway (simpler, but not obvious from plugin README).

---

## Suggestions for iExec / Nox

1. **Ship a one-command Sepolia “wrap USDC → confidentialTransfer → unwrap” sample** with known USDC address and env template.
2. **Keep Contracts Wizard deploy path green** or mark it experimental and point to Hardhat starter with matching constructor args.
3. **Sync gateway ACL with on-chain `isPubliclyDecryptable` faster**, or return **404 NotYetComputed** instead of **403 access_denied** when the flag is true but ciphertext/index is lagging (would have saved hours).
4. **Document Safe / multisig patterns** explicitly (operator, wrap-to-EOA, or recommended multi-send limits).
5. **Document `finalizeUnwrap` proof format** next to `publicDecrypt` (65-byte sig ‖ plaintext) with a full TypeScript snippet.
6. **Refresh constructor examples** in the ERC-20 wrapper guide to match `nox-confidential-contracts@0.2.x`.
7. **Explorer-friendly events**: ConfidentialTransfer is good; a short “how to verify privacy on Etherscan” blurb would help demos.

---

## Overall

Nox is **usable for a real payroll product story** on Sepolia: wrap, encrypted multi-recipient pays, private decrypt, unwrap to USDC. The main friction was **tooling lag and error opacity** (wizard, GS013, gateway 403 vs on-chain public flag), not the core handle/TEE model.

We would keep building on Nox for confidential settlement; clearer Sepolia happy-path samples and friendlier gateway errors would make adoption much faster for other WTF teams.
