# Nox confidential payroll setup (Sepolia)

VeilPay settles payroll through **iExec Nox** when the organization
`executionProvider` is `nox`.

## Flow

1. Deploy (or reuse) an **ERC-20 → ERC-7984 wrapper** for Sepolia USDC
   (`0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`).
2. Set the wrapper address on the org (`confidentialTokenAddress`) or API env
   `NOX_CTOKEN_ADDRESS`.
3. Fund the **Nox payer EOA** (`NOX_PAYER_PRIVATE_KEY` or `SAFE_OWNER_PRIVATE_KEY`)
   with Sepolia ETH (gas) and Sepolia USDC.
4. Create → approve → **Execute payroll**. The API will:
   - wrap USDC into the confidential token when the payer has enough underlying
   - `encryptInput` each net amount with `@iexec-nox/handle`
   - call `confidentialTransfer(to, handle, proof)` per employee

## Deploy a wrapper

Use the official wizard (recommended):

- https://cdefi-wizard.iex.ec
- https://docs.noxprotocol.io/guides/build-confidential-tokens/erc20-to-erc7984-wrapper

Solidity sketch:

```solidity
import {ERC20ToERC7984Wrapper} from "@iexec-nox/nox-confidential-contracts/contracts/token/extensions/ERC20ToERC7984Wrapper.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract WrappedSepoliaUSDC is ERC20ToERC7984Wrapper {
    constructor(IERC20 usdc)
        ERC20ToERC7984Wrapper(usdc)
        ERC7984("Wrapped Confidential USDC", "wcUSDC", "")
    {}
}
```

## API env

```env
BLOCKCHAIN_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
NOX_PAYER_PRIVATE_KEY=0x...
NOX_CTOKEN_ADDRESS=0x...
# optional fallback signer
SAFE_OWNER_PRIVATE_KEY=0x...
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
5. Employee decrypts confidential balance with handle SDK / cToken demo tools
