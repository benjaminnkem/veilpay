// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;
import {PayrollManifest} from '../PayrollManifest.sol';
contract ManifestHarness {
  function compute(
    uint256 chainId,
    address payroll,
    address token,
    address treasury,
    bytes32 payrollId,
    address[] calldata recipients,
    bytes32[] calldata handles,
    uint48 deadline
  ) external pure returns (bytes32) {
    return
      PayrollManifest.hash(
        chainId,
        payroll,
        token,
        treasury,
        payrollId,
        recipients,
        handles,
        recipients.length,
        deadline
      );
  }
}
