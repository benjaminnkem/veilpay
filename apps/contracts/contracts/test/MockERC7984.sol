// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {
  externalEuint256,
  euint256
} from '@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol';

/// @dev Deterministic test double for payroll authorization/state tests. Real Nox integration is separate.
contract MockERC7984 {
  mapping(address => uint256) public clearBalanceForTest;
  mapping(bytes32 => uint256) public clearAmountForTest;
  mapping(address => mapping(address => uint48)) public operatorUntil;

  error UnauthorizedOperator();
  error UnknownHandle(bytes32 handle);
  error InsufficientBalance();

  function setTestBalance(address holder, uint256 amount) external {
    clearBalanceForTest[holder] = amount;
  }
  function registerTestHandle(bytes32 handle, uint256 amount) external {
    clearAmountForTest[handle] = amount;
  }
  function setOperatorForTest(
    address holder,
    address operator,
    uint48 until
  ) external {
    operatorUntil[holder][operator] = until;
  }
  function setOperator(address operator, uint48 until) external {
    operatorUntil[msg.sender][operator] = until;
  }
  function isOperator(
    address holder,
    address operator
  ) external view returns (bool) {
    return
      holder == operator || block.timestamp <= operatorUntil[holder][operator];
  }

  function confidentialTransferFrom(
    address from,
    address to,
    externalEuint256 encryptedAmount,
    bytes calldata
  ) external returns (euint256) {
    if (from != msg.sender && block.timestamp > operatorUntil[from][msg.sender])
      revert UnauthorizedOperator();
    bytes32 handle = externalEuint256.unwrap(encryptedAmount);
    uint256 amount = clearAmountForTest[handle];
    if (amount == 0) revert UnknownHandle(handle);
    if (clearBalanceForTest[from] < amount) revert InsufficientBalance();
    clearBalanceForTest[from] -= amount;
    clearBalanceForTest[to] += amount;
    return euint256.wrap(handle);
  }
}
