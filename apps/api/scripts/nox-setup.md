# Nox confidential payroll setup (Sepolia)

VeilPay settles payroll through **iExec Nox** when the organization
`executionProvider` is `nox`.

## Flow

1. Deploy (or reuse) an **ERC-20 → ERC-7984 wrapper** for Sepolia USDC
   (`0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`).
2. Set the wrapper address on the org (`confidentialTokenAddress`) or API env
   `NOX_CTOKEN_ADDRESS`.
3. Link the **organization Safe** (holds Sepolia USDC + a little ETH for gas).
   `SAFE_OWNER_PRIVATE_KEY` is only the Safe owner signer (e.g. MetaMask) — it
   does **not** need to hold payroll USDC.
4. Create → approve → **Execute payroll**. The API will:
   - `encryptInput` each net amount with `@iexec-nox/handle` (owner signs gateway)
   - Safe multi-send: `USDC.approve` → `cToken.wrap(safe, total)` →
     `confidentialTransfer` per employee (all as the Safe)

## Deploy a wrapper (local Hardhat)

Skip the online wizard. From the monorepo:

```sh
export SEPOLIA_PRIVATE_KEY=0xYOUR_KEY
export SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

pnpm --filter contracts compile
pnpm --filter contracts deploy:wcusdc
```

Uses `apps/contracts/contracts/WrappedSepoliaUSDC.sol` on top of official
`@iexec-nox/nox-confidential-contracts` (solc **0.8.35**, `evmVersion: osaka`).
Full notes: `apps/contracts/README.md`.

## API env

```env
BLOCKCHAIN_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
SAFE_OWNER_PRIVATE_KEY=0x...   # MetaMask owner of the org Safe
NOX_CTOKEN_ADDRESS=0x...       # deployed wcUSDC wrapper
# optional override if different from Safe owner
# NOX_PAYER_PRIVATE_KEY=0x...
```

## Nox protocol (Sepolia)

| Piece | Value |
| ----- | ----- |
| Chain | Ethereum Sepolia `11155111` |
| NoxCompute | `0x24ef36ec5b626d7dcd09a98f3083c2758f0f77bf` |
| Gateway | `https://gateway-testnets.noxprotocol.dev` |
| JS SDK | `@iexec-nox/handle` |

## Demo checklist

1. Org settings → Nox card → paste cToken → mode **Confidential Nox**
2. Employees link payout wallets
3. Payroll approve path
4. Execute → explorer shows transfers without public amounts
5. Employee: **Settings → Confidential payout (Nox)**
   - **Decrypt balance** (private view via Nox ACL)
   - **Unwrap all to USDC** (2 txs: burn + finalize with publicDecrypt proof)
