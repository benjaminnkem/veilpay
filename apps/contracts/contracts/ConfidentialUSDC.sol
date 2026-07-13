// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {IERC20} from '@openzeppelin/contracts/interfaces/IERC20.sol';
import {ERC20ToERC7984Wrapper} from '@iexec-nox/nox-confidential-contracts/contracts/token/extensions/ERC20ToERC7984Wrapper.sol';

/// @notice TESTNET/DEMO confidential wrapper around MockUSDC using official Nox ERC-7984.
contract ConfidentialUSDC is ERC20ToERC7984Wrapper {
  constructor(
    IERC20 underlying_
  )
    ERC20ToERC7984Wrapper(
      'VeilPay Confidential Test USDC',
      'ctUSDC',
      'ipfs://veilpay-test-token-metadata',
      underlying_
    )
  {}
}
