// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';

/// @notice TEST ONLY public-value USDC stand-in used to fund the confidential wrapper.
/// @dev Faucet amounts and recipients are intentionally public and the token has no monetary value.
contract MockUSDC is ERC20 {
  uint256 public constant FAUCET_AMOUNT = 10_000 * 1e6;
  mapping(address => uint48) public lastFaucetAt;

  error FaucetCooldown(uint48 availableAt);

  constructor() ERC20('VeilPay Test USDC', 'tUSDC') {}

  function decimals() public pure override returns (uint8) {
    return 6;
  }

  function faucet(address to) external {
    uint48 availableAt = lastFaucetAt[to] + 1 days;
    if (lastFaucetAt[to] != 0 && block.timestamp < availableAt)
      revert FaucetCooldown(availableAt);
    lastFaucetAt[to] = uint48(block.timestamp);
    _mint(to, FAUCET_AMOUNT);
  }
}
