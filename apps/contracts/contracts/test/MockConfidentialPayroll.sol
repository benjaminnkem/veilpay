// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {
  externalEuint256,
  euint256
} from '@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol';
import {ConfidentialPayroll} from '../ConfidentialPayroll.sol';

/// @dev Unit-test harness that bypasses Nox proof validation. Real proof and ACL
/// behavior is covered by the opt-in Nox end-to-end test using ConfidentialPayroll.
contract MockConfidentialPayroll is ConfidentialPayroll {
  constructor(uint256 maxBatchSize_) ConfidentialPayroll(maxBatchSize_) {}

  function _fromExternal(
    externalEuint256 encryptedAmount,
    bytes calldata
  ) internal pure override returns (euint256) {
    return euint256.wrap(externalEuint256.unwrap(encryptedAmount));
  }
}
