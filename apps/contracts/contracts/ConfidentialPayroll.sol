// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {
  externalEuint256,
  euint256
} from '@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol';
import {IERC7984} from '@iexec-nox/nox-confidential-contracts/contracts/interfaces/IERC7984.sol';
import {PayrollManifest} from './PayrollManifest.sol';

/// @title Exact-manifest confidential payroll executor
/// @notice A treasury Safe approves an immutable manifest; anyone may then pay gas to execute it.
/// @dev The executor has no arbitrary-call or recipient/amount selection authority. Encrypted inputs
/// must be produced for this contract because the ERC-7984 token validates its caller against Nox ACL.
contract ConfidentialPayroll {
  uint256 public immutable maxBatchSize;

  enum Status {
    NONE,
    APPROVED,
    EXECUTING,
    EXECUTED,
    CANCELLED
  }

  struct Approval {
    bytes32 manifestHash;
    address token;
    uint32 itemCount;
    uint48 deadline;
    Status status;
  }

  mapping(address treasury => mapping(bytes32 payrollId => Approval))
    private _approvals;

  error InvalidMaxBatchSize();
  error PayrollAlreadyExists(address treasury, bytes32 payrollId);
  error PayrollUnknown(address treasury, bytes32 payrollId);
  error PayrollExpired(uint48 deadline);
  error PayrollIsCancelled(address treasury, bytes32 payrollId);
  error PayrollAlreadyExecuted(address treasury, bytes32 payrollId);
  error PayrollExecuting(address treasury, bytes32 payrollId);
  error ManifestMismatch(bytes32 expected, bytes32 actual);
  error InvalidToken();
  error InvalidDeadline();
  error InvalidItemCount(uint256 count);
  error ArrayLengthMismatch();
  error InvalidRecipient(uint256 index);
  error DuplicateRecipient(uint256 firstIndex, uint256 secondIndex);
  error OperatorPermissionMissing(address treasury, address token);

  event PayrollApproved(
    address indexed treasury,
    bytes32 indexed payrollId,
    bytes32 indexed manifestHash,
    address token,
    uint256 itemCount,
    uint48 deadline
  );
  event PayrollCancelled(address indexed treasury, bytes32 indexed payrollId);
  event PayrollExecutionStarted(
    address indexed treasury,
    bytes32 indexed payrollId,
    bytes32 indexed manifestHash
  );
  event PayrollItemTransferred(
    address indexed treasury,
    bytes32 indexed payrollId,
    uint256 indexed itemIndex,
    address recipient,
    euint256 encryptedTransferredHandle
  );
  event PayrollExecuted(
    address indexed treasury,
    bytes32 indexed payrollId,
    bytes32 indexed manifestHash,
    uint256 itemCount
  );

  constructor(uint256 maxBatchSize_) {
    if (maxBatchSize_ == 0) revert InvalidMaxBatchSize();
    maxBatchSize = maxBatchSize_;
  }

  /// @notice Approves one exact payroll for `msg.sender`, expected to be the company Safe.
  function approvePayroll(
    bytes32 payrollId,
    bytes32 manifestHash,
    address token,
    uint32 itemCount,
    uint48 deadline
  ) external {
    if (token == address(0)) revert InvalidToken();
    if (manifestHash == bytes32(0))
      revert ManifestMismatch(bytes32(0), manifestHash);
    if (itemCount == 0 || itemCount > maxBatchSize)
      revert InvalidItemCount(itemCount);
    if (deadline <= block.timestamp) revert InvalidDeadline();
    Approval storage approval = _approvals[msg.sender][payrollId];
    if (approval.status != Status.NONE)
      revert PayrollAlreadyExists(msg.sender, payrollId);
    approval.manifestHash = manifestHash;
    approval.token = token;
    approval.itemCount = itemCount;
    approval.deadline = deadline;
    approval.status = Status.APPROVED;
    emit PayrollApproved(
      msg.sender,
      payrollId,
      manifestHash,
      token,
      itemCount,
      deadline
    );
  }

  /// @notice Cancels the caller treasury's approval before execution.
  function cancelPayroll(bytes32 payrollId) external {
    Approval storage approval = _approvals[msg.sender][payrollId];
    if (approval.status == Status.NONE)
      revert PayrollUnknown(msg.sender, payrollId);
    if (approval.status == Status.CANCELLED)
      revert PayrollIsCancelled(msg.sender, payrollId);
    if (approval.status == Status.EXECUTED)
      revert PayrollAlreadyExecuted(msg.sender, payrollId);
    if (approval.status == Status.EXECUTING)
      revert PayrollExecuting(msg.sender, payrollId);
    approval.status = Status.CANCELLED;
    emit PayrollCancelled(msg.sender, payrollId);
  }

  /// @notice Executes the exact approved recipients and encrypted handles.
  /// @dev State moves to EXECUTING before external token calls (checks-effects-interactions).
  function executePayroll(
    address treasury,
    bytes32 payrollId,
    address token,
    address[] calldata recipients,
    externalEuint256[] calldata encryptedAmountHandles,
    bytes[] calldata inputProofs,
    uint48 deadline
  ) external {
    Approval storage approval = _approvals[treasury][payrollId];
    if (approval.status == Status.NONE)
      revert PayrollUnknown(treasury, payrollId);
    if (approval.status == Status.CANCELLED)
      revert PayrollIsCancelled(treasury, payrollId);
    if (approval.status == Status.EXECUTED)
      revert PayrollAlreadyExecuted(treasury, payrollId);
    if (approval.status == Status.EXECUTING)
      revert PayrollExecuting(treasury, payrollId);
    if (block.timestamp > approval.deadline)
      revert PayrollExpired(approval.deadline);
    if (token != approval.token) revert InvalidToken();
    uint256 count = recipients.length;
    if (count == 0 || count > maxBatchSize || count != approval.itemCount)
      revert InvalidItemCount(count);
    if (encryptedAmountHandles.length != count || inputProofs.length != count)
      revert ArrayLengthMismatch();
    if (deadline != approval.deadline) revert InvalidDeadline();

    bytes32[] memory rawHandles = new bytes32[](count);
    for (uint256 i; i < count; ++i) {
      if (recipients[i] == address(0)) revert InvalidRecipient(i);
      rawHandles[i] = externalEuint256.unwrap(encryptedAmountHandles[i]);
      for (uint256 j; j < i; ++j) {
        if (recipients[j] == recipients[i]) revert DuplicateRecipient(j, i);
      }
    }

    bytes32 actualManifest = keccak256(
      abi.encode(
        PayrollManifest.VERSION,
        block.chainid,
        address(this),
        token,
        treasury,
        payrollId,
        recipients,
        rawHandles,
        count,
        deadline
      )
    );
    if (actualManifest != approval.manifestHash)
      revert ManifestMismatch(approval.manifestHash, actualManifest);
    if (!IERC7984(token).isOperator(treasury, address(this)))
      revert OperatorPermissionMissing(treasury, token);

    approval.status = Status.EXECUTING;
    emit PayrollExecutionStarted(treasury, payrollId, actualManifest);
    for (uint256 i; i < count; ++i) {
      euint256 transferred = IERC7984(token).confidentialTransferFrom(
        treasury,
        recipients[i],
        encryptedAmountHandles[i],
        inputProofs[i]
      );
      emit PayrollItemTransferred(
        treasury,
        payrollId,
        i,
        recipients[i],
        transferred
      );
    }
    approval.status = Status.EXECUTED;
    emit PayrollExecuted(treasury, payrollId, actualManifest, count);
  }

  function getApproval(
    address treasury,
    bytes32 payrollId
  ) external view returns (Approval memory) {
    return _approvals[treasury][payrollId];
  }

  function manifestVersion() external pure returns (uint16) {
    return PayrollManifest.VERSION;
  }

  function computeManifestHash(
    address token,
    address treasury,
    bytes32 payrollId,
    address[] calldata recipients,
    bytes32[] calldata encryptedAmountHandles,
    uint48 deadline
  ) external view returns (bytes32) {
    return
      PayrollManifest.hash(
        block.chainid,
        address(this),
        token,
        treasury,
        payrollId,
        recipients,
        encryptedAmountHandles,
        recipients.length,
        deadline
      );
  }
}
