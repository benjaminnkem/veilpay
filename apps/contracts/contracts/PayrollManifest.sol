// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

/// @title Canonical confidential-payroll manifest hashing
/// @notice The backend reproduces this exact `abi.encode` tuple with viem.
library PayrollManifest {
  uint16 internal constant VERSION = 1;

  function hash(
    uint256 chainId,
    address payrollContract,
    address token,
    address treasury,
    bytes32 payrollId,
    address[] calldata recipients,
    bytes32[] calldata encryptedAmountHandles,
    uint256 itemCount,
    uint48 deadline
  ) internal pure returns (bytes32) {
    return
      keccak256(
        abi.encode(
          VERSION,
          chainId,
          payrollContract,
          token,
          treasury,
          payrollId,
          recipients,
          encryptedAmountHandles,
          itemCount,
          deadline
        )
      );
  }
}
