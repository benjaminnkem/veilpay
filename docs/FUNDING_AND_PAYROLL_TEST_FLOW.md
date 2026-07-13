# Funding and confidential payroll test flow

This guide uses test funds only. The company owner controls the Safe; the backend relayer only pays gas for an already-approved payroll. Never paste a seed phrase or private key into the app, this page, or a terminal.

## Start the observer page

Run the API, then serve the tools directory on port 3000 (the API's default CORS configuration allows it):

```bash
pnpm --filter api dev
python3 -m http.server 3000 --directory apps/api/tools
```

Open [Payroll Observer](http://localhost:3000/payroll-observer.html). Paste JWT access tokens only into the local page. They are kept in browser memory and are cleared on reload.

## Before beginning

You need three wallets/accounts:

1. A company-owner MetaMask wallet. It will own the company Safe and sign the Safe approval.
2. One or more employee MetaMask wallets. Each must be different from the owner wallet and linked to the employee account through SIWE.
3. The configured relayer wallet. It is held by the backend environment and only pays gas for the final exact-manifest execution. You do not connect it to MetaMask.

Use the same configured network everywhere. The deployed `CONFIDENTIAL_TOKEN_ADDRESS` and `CONFIDENTIAL_PAYROLL_ADDRESS` must belong to that network.

## Full flow and expected result

| Step                        | What you do                                                                                                                                    | Expected API/observer result                                                                         | What to expect in Safe Wallet                                                                                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Verify the owner wallet  | Sign the SIWE challenge with the company-owner wallet.                                                                                         | A verified primary wallet exists.                                                                    | Nothing yet.                                                                                                                                                             |
| 2. Create and deploy Safe   | Create a deployment intent, send its returned transaction in MetaMask, then submit the transaction hash.                                       | `GET /companies/:companyId/safe` returns `status: VERIFIED`, the Safe address, owner threshold `1`.  | Open `https://app.safe.global/home?safe=sep:<SAFE_ADDRESS>` while connected as the owner. The Safe should be visible.                                                    |
| 3. Fund the Safe            | Create a funding intent with an integer base-unit amount, broadcast it, and submit the hash. Example: `10000000000` is `10,000.000000` ctUSDC. | Funding is `VERIFIED`; the Observer shows a non-zero confidential treasury handle.                   | The faucet transaction is public. The Safe address is visible, but Safe Wallet is not expected to show the confidential ctUSDC number.                                   |
| 4. Invite/onboard employees | Invite each employee with salary and frequency. Each employee accepts, verifies their own wallet, and is activated.                            | Employee list shows `ACTIVE`, a wallet, and `salaryCiphertext: [ENCRYPTED]`.                         | No Safe balance change.                                                                                                                                                  |
| 5. Create payroll draft     | Create a payroll selecting active employees.                                                                                                   | Payroll is `DRAFT`; it is only a database snapshot. No money has moved.                              | No Safe transaction and no balance change.                                                                                                                               |
| 6. Prepare payroll          | Call prepare.                                                                                                                                  | Payroll becomes `PREPARED`; encrypted inputs and an immutable manifest are made. No money has moved. | No Safe transaction and no balance change.                                                                                                                               |
| 7. Build, sign, and propose | Build the Safe transaction; owner signs it; backend proposes it to Safe service.                                                               | Payroll becomes `PROPOSED`.                                                                          | The approval batch should appear in the Safe transaction queue/history. Still no balance change.                                                                         |
| 8. Execute Safe approval    | Owner executes the proposed Safe transaction, then submit/sync its hash.                                                                       | Payroll becomes `SAFE_APPROVED`.                                                                     | The Safe batch sets a time-limited operator and approves the exact manifest. It does not transfer salary yet.                                                            |
| 9. Execute payroll          | Call the payroll execute endpoint. The relayer submits the payroll contract call.                                                              | Payroll becomes `EXECUTED`, has `executionTxHash`, and items become confirmed.                       | This transaction is sent by the relayer, not the Safe. Safe Wallet may not list it as a Safe-originated transaction; confidential token amounts remain unreadable there. |
| 10. Verify employee result  | Sign in as the employee, use the employee JWT in the Observer, connect that employee's wallet, and select **Load & decrypt employee balance**. | The Observer displays the employee's cumulative ctUSDC balance and raw base units.                   | This is not a Safe Wallet view.                                                                                                                                          |

## How to read amounts

ctUSDC has six decimals. The Observer displays both forms:

```text
10 ctUSDC = 10,000,000 base units
4250.50 ctUSDC = 4,250,500,000 base units
```

The employee result is a cumulative balance. If their balance was zero before execution, it should equal the payroll salary. If they had an earlier payment, it should equal the old balance plus the new salary.

## Where balances are visible

- Safe Wallet: Safe address, owners, threshold, standard/public assets, and the Safe approval transaction.
- Observer treasury card: existence of the Safe's encrypted ctUSDC balance handle. The current product does not support decrypting its numeric amount because the Safe contract—not its owner EOA—has the handle's Nox permission.
- Observer employee card: numeric confidential balance, after the employee signs the Nox decryption request with their own wallet.

## Common checks when an employee amount looks wrong

1. Confirm the payroll is `EXECUTED`, not merely `DRAFT`, `PREPARED`, `PROPOSED`, or `SAFE_APPROVED`.
2. Confirm the employee endpoint response's `walletAddress` is the employee EOA, not the Safe address.
3. Fetch a fresh employee balance handle after execution; do not reuse a treasury handle.
4. Compare values in six-decimal base units before concluding that funding and salary differ.
5. Check that `CONFIDENTIAL_TOKEN_ADDRESS`, `CONFIDENTIAL_PAYROLL_ADDRESS`, and MetaMask all point to the same network.
