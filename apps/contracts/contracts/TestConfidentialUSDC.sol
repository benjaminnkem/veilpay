// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {Nox} from '@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol';
import {ERC7984} from '@iexec-nox/nox-confidential-contracts/contracts/token/ERC7984.sol';

/// @notice TEST ONLY confidential USD token with a public-amount faucet.
/// @dev Faucet recipient, amount, and timing are public; resulting balances and transfers use Nox handles.
contract TestConfidentialUSDC is ERC7984 {
  uint256 public constant MAX_FAUCET_AMOUNT = 100_000 * 1e6;
  mapping(address => uint48) public lastFaucetAt;
  error InvalidFaucetAmount();
  error FaucetCooldown(uint48 availableAt);

  constructor()
    ERC7984(
      'VeilPay Confidential Test USDC',
      'ctUSDC',
      'ipfs://veilpay-test-token-metadata'
    )
  {}
  function decimals() public pure override returns (uint8) {
    return 6;
  }

  function faucet(address to, uint256 amount) external {
    if (to == address(0) || amount == 0 || amount > MAX_FAUCET_AMOUNT)
      revert InvalidFaucetAmount();
    // uint48 availableAt = lastFaucetAt[to] + 1 days;
    // if (lastFaucetAt[to] != 0 && block.timestamp < availableAt)
    //   revert FaucetCooldown(availableAt);
    lastFaucetAt[to] = uint48(block.timestamp);
    _mint(to, Nox.toEuint256(amount));
  }
}
