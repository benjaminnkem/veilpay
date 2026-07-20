# Nox confidential payroll setup (Sepolia)

When the organization `executionProvider` is `nox`, VeilPay settles via **iExec Nox** (encrypted ERC-7984), using the org **Safe** as the USDC source.

## Settlement flow (current)

1. Deploy **WrappedSepoliaUSDC** (ERC-20 → ERC-7984 wrapper) for Circle Sepolia USDC.
2. Set wrapper on the org (`confidentialTokenAddress`) and/or `NOX_CTOKEN_ADDRESS`.
3. Link the **Safe** (holds USDC + ETH for wrap gas).
4. `SAFE_OWNER_PRIVATE_KEY` = MetaMask owner of that Safe (ETH for pay txs).
5. On **Execute**:
   - Safe multi-send: `USDC.approve` + `cToken.wrap(ownerEOA, total)` — USDC leaves Safe into wrapper
   - Owner EOA: `@iexec-nox/handle` `encryptInput` + `confidentialTransfer` per employee
6. Employee: **Settings → Confidential payout** → decrypt and/or unwrap to plain USDC

Safe multi-send of `confidentialTransfer` was abandoned after repeated **GS013** (opaque inner reverts). Hybrid wrap-from-Safe / pay-from-EOA still spends Safe USDC and keeps amounts confidential.

## Deploy wrapper (Hardhat)

```sh
export SEPOLIA_PRIVATE_KEY=0xYOUR_KEY
export SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

pnpm --filter contracts compile
pnpm --filter contracts deploy:wcusdc
```

See [apps/contracts/README.md](../../contracts/README.md).

## API env

```env
BLOCKCHAIN_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
SAFE_OWNER_PRIVATE_KEY=0x...
NOX_CTOKEN_ADDRESS=0x...
```

## Protocol addresses (Sepolia)

| Piece | Value |
| ----- | ----- |
| Chain | Ethereum Sepolia `11155111` |
| NoxCompute | `0x24ef36ec5b626d7dcd09a98f3083c2758f0f77bf` |
| Gateway | `https://gateway-testnets.noxprotocol.dev` |
| Sepolia USDC | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |
| JS SDK | `@iexec-nox/handle` |

## Demo checklist

1. Org: Safe + cToken + mode **Confidential Nox**
2. Employees link payout wallets
3. Payroll: create → approve → execute (1–2 min)
4. Explorer: wrap + `confidentialTransfer` (no public amounts)
5. Employee: decrypt balance → unwrap to USDC (use **Finalize pending unwrap** if gateway lags)

Hackathon feedback: [feedback.md](../../../feedback.md)  
Full dry-run: [README.md](../../../README.md#sepolia-dry-run-confidential-payroll)
