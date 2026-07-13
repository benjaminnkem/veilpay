import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const uuid = {
  format: 'uuid',
  example: '9f8f46f2-435f-45d4-a2e4-fcd69e8b57bb',
};
const address = {
  format: 'ethereum-address',
  example: '0x1111111111111111111111111111111111111111',
};
const hash = {
  example: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
};
const dateTime = {
  type: String,
  format: 'date-time',
  example: '2026-07-13T12:00:00.000Z',
};

export class ApiErrorResponseDto {
  @ApiProperty({ example: 'COMPANY_ACCESS_DENIED' }) code!: string;
  @ApiProperty({ example: 'Company access denied' }) message!: string;
  @ApiPropertyOptional({
    type: [String],
    example: ['email must be an email'],
    description: 'Present for DTO validation failures.',
  })
  details?: string[];
  @ApiProperty({ example: 403 }) statusCode!: number;
  @ApiPropertyOptional({
    example: 'request-01J2ZQ',
    description: 'Echoed or generated request correlation ID.',
  })
  requestId?: string;
  @ApiProperty(dateTime) timestamp!: string;
  @ApiProperty({
    example: '/api/v1/companies/9f8f46f2-435f-45d4-a2e4-fcd69e8b57bb',
  })
  path!: string;
}

export class RootMessageResponseDto {
  @ApiProperty({ example: 'VeilPay API is running' }) message!: string;
}
export class LegacyHealthResponseDto {
  @ApiProperty({ example: 'ok' }) status!: string;
  @ApiProperty({ example: 'api' }) service!: string;
}
export class SignupResponseDto {
  @ApiProperty(uuid) id!: string;
  @ApiProperty({ example: 'ada@example.com' }) email!: string;
  @ApiProperty({ example: true }) emailVerificationRequired!: boolean;
}
export class VerifiedResponseDto {
  @ApiProperty({ example: true }) verified!: boolean;
}
export class AcceptedResponseDto {
  @ApiProperty({ example: true }) accepted!: boolean;
}
export class ResetResponseDto {
  @ApiProperty({ example: true }) reset!: boolean;
}
export class RevokedResponseDto {
  @ApiProperty({ example: true }) revoked!: boolean;
}
export class SelectedResponseDto {
  @ApiProperty({ example: true }) selected!: boolean;
}
export class UnlinkedResponseDto {
  @ApiProperty({ example: true }) unlinked!: boolean;
}
export class DeactivatedResponseDto {
  @ApiProperty({ example: true }) deactivated!: boolean;
}
export class AuthTokensResponseDto {
  @ApiProperty({
    description: 'Short-lived JWT access token.',
    example: 'eyJhbGciOiJIUzI1NiJ9...',
  })
  accessToken!: string;
  @ApiProperty({
    description: 'Single-use rotating refresh token.',
    example: 'eyJhbGciOiJIUzI1NiJ9...',
  })
  refreshToken!: string;
  @ApiProperty({ example: 'Bearer' }) tokenType!: string;
  @ApiProperty({ example: '15m' }) expiresIn!: string;
}
export class UserResponseDto {
  @ApiProperty(uuid) id!: string;
  @ApiProperty({ example: 'ada@example.com' }) email!: string;
  @ApiProperty({ example: 'Ada Lovelace' }) name!: string;
  @ApiPropertyOptional({ example: 'Analytical Engines Ltd', nullable: true })
  organizationName!: string | null;
  @ApiPropertyOptional({ enum: ['PENDING', 'ACTIVE', 'SUSPENDED'] })
  status?: string;
  @ApiPropertyOptional({ ...dateTime, nullable: true }) emailVerifiedAt?:
    string | null;
}

export class WalletChallengeResponseDto {
  @ApiProperty(uuid) challengeId!: string;
  @ApiProperty({ description: 'Exact EIP-4361 message the wallet must sign.' })
  message!: string;
  @ApiProperty(dateTime) expiresAt!: string;
}
export class WalletResponseDto {
  @ApiProperty(uuid) id!: string;
  @ApiProperty(uuid) userId!: string;
  @ApiProperty(address) address!: string;
  @ApiProperty({ example: 'EVM' }) chainType!: string;
  @ApiProperty(dateTime) verifiedAt!: string;
  @ApiProperty({ example: true }) isPrimary!: boolean;
  @ApiProperty(dateTime) createdAt!: string;
  @ApiProperty(dateTime) updatedAt!: string;
}

export class SafeAccountResponseDto {
  @ApiProperty(uuid) id!: string;
  @ApiProperty(uuid) companyId!: string;
  @ApiProperty({
    example: '11155111',
    description: 'Serialized bigint chain ID.',
  })
  chainId!: string;
  @ApiPropertyOptional({ ...address, nullable: true }) address!: string | null;
  @ApiProperty(address) predictedAddress!: string;
  @ApiProperty({ example: 1 }) threshold!: number;
  @ApiProperty({ enum: ['PREDICTED', 'DEPLOYED', 'VERIFIED', 'FAILED'] })
  status!: string;
  @ApiPropertyOptional({ ...hash, nullable: true }) deploymentTxHash!:
    string | null;
  @ApiPropertyOptional({ ...dateTime, nullable: true }) deployedAt!:
    string | null;
  @ApiPropertyOptional({ ...dateTime, nullable: true }) lastSyncedAt!:
    string | null;
  @ApiProperty(dateTime) createdAt!: string;
  @ApiProperty(dateTime) updatedAt!: string;
}
export class CompanyResponseDto {
  @ApiProperty(uuid) id!: string;
  @ApiProperty({ example: 'Acme Labs' }) name!: string;
  @ApiProperty({ example: 'acme-labs-a1b2c3' }) slug!: string;
  @ApiProperty({ enum: ['SAFE_NOT_CONFIGURED', 'ACTIVE', 'SUSPENDED'] })
  status!: string;
  @ApiProperty(dateTime) createdAt!: string;
  @ApiProperty(dateTime) updatedAt!: string;
  @ApiPropertyOptional({ type: [SafeAccountResponseDto] })
  safeAccounts?: SafeAccountResponseDto[];
}
export class MemberUserResponseDto {
  @ApiProperty(uuid) id!: string;
  @ApiProperty({ example: 'ada@example.com' }) email!: string;
  @ApiProperty({ example: 'Ada Lovelace' }) name!: string;
}
export class CompanyMemberResponseDto {
  @ApiProperty(uuid) id!: string;
  @ApiProperty(uuid) companyId!: string;
  @ApiProperty(uuid) userId!: string;
  @ApiProperty({ enum: ['OWNER', 'ADMIN', 'HR', 'FINANCE', 'EMPLOYEE'] })
  role!: string;
  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE'] }) status!: string;
  @ApiProperty(dateTime) createdAt!: string;
  @ApiProperty(dateTime) updatedAt!: string;
  @ApiPropertyOptional({ type: MemberUserResponseDto })
  user?: MemberUserResponseDto;
}

export class InvitationResponseDto {
  @ApiProperty(uuid) id!: string;
  @ApiProperty(uuid) companyId!: string;
  @ApiProperty({ example: 'grace@example.com' }) email!: string;
  @ApiProperty({ example: 'Grace Hopper' }) displayName!: string;
  @ApiProperty({ enum: ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'] })
  status!: string;
  @ApiProperty(dateTime) expiresAt!: string;
  @ApiPropertyOptional({ ...dateTime, nullable: true }) acceptedAt!:
    string | null;
  @ApiPropertyOptional({ ...dateTime, nullable: true }) revokedAt?:
    string | null;
  @ApiProperty(dateTime) createdAt!: string;
  @ApiPropertyOptional({
    description: 'Only emitted in NODE_ENV=test.',
    nullable: true,
  })
  testToken?: string;
}
export class EmployeeWalletResponseDto {
  @ApiProperty(address) address!: string;
  @ApiProperty(dateTime) verifiedAt!: string;
}
export class EmployeeResponseDto {
  @ApiProperty(uuid) id!: string;
  @ApiProperty(uuid) companyId!: string;
  @ApiProperty(uuid) userId!: string;
  @ApiProperty(uuid) companyMemberId!: string;
  @ApiPropertyOptional({ ...uuid, nullable: true }) walletId!: string | null;
  @ApiProperty({ example: 'Grace Hopper' }) displayName!: string;
  @ApiProperty({ example: 'grace@example.com' }) email!: string;
  @ApiProperty({ enum: ['INVITED', 'ACTIVE', 'INACTIVE', 'TERMINATED'] })
  employmentStatus!: string;
  @ApiPropertyOptional({
    example: '[ENCRYPTED]',
    nullable: true,
    description: 'Never contains salary plaintext.',
  })
  salaryCiphertext?: string | null;
  @ApiProperty({ example: 'ctUSDC' }) salaryCurrency!: string;
  @ApiPropertyOptional({ ...address, nullable: true }) salaryTokenAddress!:
    string | null;
  @ApiProperty({ enum: ['WEEKLY', 'BIWEEKLY', 'MONTHLY'] })
  payFrequency!: string;
  @ApiPropertyOptional({ ...dateTime, nullable: true }) startDate!:
    string | null;
  @ApiPropertyOptional({ ...dateTime, nullable: true }) endDate!: string | null;
  @ApiPropertyOptional({ type: EmployeeWalletResponseDto, nullable: true })
  wallet?: EmployeeWalletResponseDto | null;
  @ApiProperty(dateTime) createdAt!: string;
  @ApiProperty(dateTime) updatedAt!: string;
}

export class EvmTransactionResponseDto {
  @ApiProperty(address) to!: string;
  @ApiProperty({
    example: '0',
    description: 'Native currency value in wei as a decimal string.',
  })
  value!: string;
  @ApiProperty({ example: '0xabcdef', description: 'ABI-encoded calldata.' })
  data!: string;
}
export class SafeDeploymentIntentResponseDto {
  @ApiProperty(uuid) intentId!: string;
  @ApiProperty({ example: '11155111' }) chainId!: string;
  @ApiProperty(address) predictedSafeAddress!: string;
  @ApiProperty({ type: EvmTransactionResponseDto })
  transaction!: EvmTransactionResponseDto;
}
export class SafeSyncResponseDto extends SafeAccountResponseDto {
  @ApiProperty({
    type: [String],
    example: ['0x1111111111111111111111111111111111111111'],
  })
  owners!: string[];
  @ApiProperty({ example: true }) deployed!: boolean;
}
export class FundingIntentResponseDto {
  @ApiProperty(uuid) intentId!: string;
  @ApiProperty({ example: '11155111' }) chainId!: string;
  @ApiProperty({ type: EvmTransactionResponseDto })
  transaction!: EvmTransactionResponseDto;
  @ApiProperty({
    example: 'The test faucet recipient, amount, and timing are public.',
  })
  privacyNotice!: string;
}
export class FundingRecordResponseDto {
  @ApiProperty(uuid) id!: string;
  @ApiProperty(uuid) companyId!: string;
  @ApiProperty({ example: '11155111' }) chainId!: string;
  @ApiProperty(address) to!: string;
  @ApiProperty({ example: '0' }) value!: string;
  @ApiProperty({ example: '0xabcdef' }) data!: string;
  @ApiProperty({ example: '10000000000' }) amountBaseUnits!: string;
  @ApiProperty({ enum: ['CREATED', 'SUBMITTED', 'VERIFIED', 'FAILED'] })
  status!: string;
  @ApiPropertyOptional({ ...hash, nullable: true }) txHash!: string | null;
  @ApiPropertyOptional({ example: '0x1234...', nullable: true })
  balanceHandle!: string | null;
  @ApiProperty(dateTime) expiresAt!: string;
  @ApiProperty(dateTime) createdAt!: string;
  @ApiProperty(dateTime) updatedAt!: string;
}
export class TreasuryBalanceHandleResponseDto {
  @ApiProperty(address) token!: string;
  @ApiPropertyOptional({ ...address, nullable: true }) account!: string | null;
  @ApiPropertyOptional({ example: '0x1234...', nullable: true }) handle!:
    string | null;
}

export class PayrollItemResponseDto {
  @ApiProperty(uuid) id!: string;
  @ApiProperty({ example: 0 }) itemIndex!: number;
  @ApiProperty(address) recipientAddress!: string;
  @ApiPropertyOptional({ example: '0x1234...', nullable: true })
  encryptedHandle!: string | null;
  @ApiProperty({
    enum: ['SNAPSHOTTED', 'PREPARED', 'SUBMITTED', 'CONFIRMED', 'FAILED'],
  })
  status!: string;
  @ApiPropertyOptional({ ...hash, nullable: true }) txHash!: string | null;
}
export class PayrollResponseDto {
  @ApiProperty(uuid) id!: string;
  @ApiProperty(uuid) companyId!: string;
  @ApiProperty({
    example: '11155111',
    description: 'Serialized bigint chain ID.',
  })
  chainId!: string;
  @ApiProperty({ example: 'July 2026 payroll' }) label!: string;
  @ApiProperty({
    enum: [
      'DRAFT',
      'PREPARING',
      'PREPARED',
      'PROPOSING',
      'PROPOSED',
      'SAFE_APPROVED',
      'EXECUTING',
      'EXECUTED',
      'CANCELLED',
      'EXPIRED',
      'SAFE_REJECTED',
      'FAILED_RETRYABLE',
      'FAILED_FINAL',
    ],
  })
  status!: string;
  @ApiProperty({ example: 2 }) itemCount!: number;
  @ApiProperty(address) tokenAddress!: string;
  @ApiProperty(address) payrollContractAddress!: string;
  @ApiProperty(hash) onchainPayrollId!: string;
  @ApiPropertyOptional({ ...hash, nullable: true }) manifestHash!:
    string | null;
  @ApiPropertyOptional({ ...dateTime, nullable: true }) deadline!:
    string | null;
  @ApiPropertyOptional({ ...hash, nullable: true }) safeTxHash!: string | null;
  @ApiPropertyOptional({ ...hash, nullable: true }) executionTxHash!:
    string | null;
  @ApiPropertyOptional({ type: [PayrollItemResponseDto] })
  items?: PayrollItemResponseDto[];
  @ApiProperty(dateTime) createdAt!: string;
  @ApiProperty(dateTime) updatedAt!: string;
}
export class PayrollSummaryResponseDto {
  @ApiProperty(uuid) id!: string;
  @ApiProperty({ example: 'July 2026 payroll' }) label!: string;
  @ApiProperty({
    enum: [
      'DRAFT',
      'PREPARING',
      'PREPARED',
      'PROPOSING',
      'PROPOSED',
      'SAFE_APPROVED',
      'EXECUTING',
      'EXECUTED',
      'CANCELLED',
      'EXPIRED',
      'SAFE_REJECTED',
      'FAILED_RETRYABLE',
      'FAILED_FINAL',
    ],
  })
  status!: string;
  @ApiProperty({ example: 2 }) itemCount!: number;
  @ApiPropertyOptional({ ...dateTime, nullable: true }) deadline!:
    string | null;
  @ApiPropertyOptional({ ...hash, nullable: true }) manifestHash!:
    string | null;
  @ApiPropertyOptional({ ...hash, nullable: true }) safeTxHash!: string | null;
  @ApiPropertyOptional({ ...hash, nullable: true }) executionTxHash!:
    string | null;
  @ApiProperty(dateTime) createdAt!: string;
}
export class SafeCallResponseDto extends EvmTransactionResponseDto {
  @ApiProperty({ example: 0, description: 'Safe operation type; 0 is CALL.' })
  operation!: number;
}
export class SafeTransactionDataResponseDto extends SafeCallResponseDto {
  @ApiProperty({ example: '0' }) safeTxGas!: string;
  @ApiProperty({ example: '0' }) baseGas!: string;
  @ApiProperty({ example: '0' }) gasPrice!: string;
  @ApiProperty(address) gasToken!: string;
  @ApiProperty(address) refundReceiver!: string;
  @ApiProperty({ example: 0 }) nonce!: number;
}
export class PayrollSafeTransactionResponseDto {
  @ApiProperty(address) safeAddress!: string;
  @ApiProperty(hash) safeTxHash!: string;
  @ApiProperty({ type: SafeTransactionDataResponseDto })
  transactionData!: SafeTransactionDataResponseDto;
  @ApiProperty({ type: [SafeCallResponseDto] }) calls!: SafeCallResponseDto[];
  @ApiProperty({
    example: 'personal_sign safeTxHash (backend converts v for Safe ETH_SIGN)',
  })
  signingMethod!: string;
}
export class PayrollStatusResponseDto {
  @ApiProperty({ example: 'PROPOSED' }) status!: string;
  @ApiPropertyOptional(hash) safeTxHash?: string;
}
export class PayrollApprovalResponseDto {
  @ApiProperty({ example: 'SAFE_APPROVED' }) status!: string;
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Direct on-chain approval tuple serialized to JSON.',
  })
  approval!: Record<string, unknown>;
}
export class PayrollCancellationResponseDto {
  @ApiProperty({ example: 'CANCELLED' }) status!: string;
  @ApiPropertyOptional({ example: true }) requiresSafeExecution?: boolean;
  @ApiPropertyOptional({ type: EvmTransactionResponseDto })
  transaction?: EvmTransactionResponseDto;
}
export class PayrollReconciliationResponseDto {
  @ApiProperty({ example: 'EXECUTED' }) databaseStatus!: string;
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Direct on-chain approval tuple serialized to JSON.',
  })
  onchainApproval!: Record<string, unknown>;
}

export class EmployeeCompanySummaryDto {
  @ApiProperty(uuid) id!: string;
  @ApiProperty({ example: 'Acme Labs' }) name!: string;
  @ApiProperty({ enum: ['SAFE_NOT_CONFIGURED', 'ACTIVE', 'SUSPENDED'] })
  status!: string;
}
export class EmployeeCompanyResponseDto {
  @ApiProperty(uuid) id!: string;
  @ApiProperty({ enum: ['INVITED', 'ACTIVE', 'INACTIVE', 'TERMINATED'] })
  employmentStatus!: string;
  @ApiProperty({ type: EmployeeCompanySummaryDto })
  company!: EmployeeCompanySummaryDto;
}
export class EmployeePaymentRunDto {
  @ApiProperty(uuid) id!: string;
  @ApiProperty({ example: 'July 2026 payroll' }) label!: string;
  @ApiPropertyOptional({ ...dateTime, nullable: true }) executedAt!:
    string | null;
  @ApiProperty(address) tokenAddress!: string;
  @ApiProperty({ example: '11155111' }) chainId!: string;
}
export class EmployeePaymentResponseDto {
  @ApiProperty(uuid) id!: string;
  @ApiProperty({ enum: ['CONFIRMED'] }) status!: string;
  @ApiPropertyOptional({ ...hash, nullable: true }) txHash!: string | null;
  @ApiPropertyOptional({ example: '5000000', nullable: true }) blockNumber!:
    string | null;
  @ApiProperty(dateTime) createdAt!: string;
  @ApiProperty({ type: EmployeePaymentRunDto })
  payrollRun!: EmployeePaymentRunDto;
}
export class EmployeeBalanceHandleResponseDto {
  @ApiProperty({ example: 11155111 }) chainId!: number;
  @ApiProperty(address) tokenAddress!: string;
  @ApiProperty(address) walletAddress!: string;
  @ApiProperty({ example: '0x1234...' }) handle!: string;
  @ApiProperty({
    example:
      'Use @iexec-nox/handle with this wallet client; the backend never decrypts the handle.',
  })
  decryption!: string;
}

export class LivenessResponseDto {
  @ApiProperty({ example: 'ok' }) status!: string;
}
export class RpcReadinessDto {
  @ApiProperty({ example: '11155111' }) chainId!: string;
  @ApiProperty({ example: '6200000' }) blockNumber!: string;
}
export class ContractReadinessDto {
  @ApiProperty(address) payroll!: string;
  @ApiProperty(address) token!: string;
}
export class RelayerReadinessDto {
  @ApiProperty({ example: true }) configured!: boolean;
  @ApiPropertyOptional(address) address?: string;
  @ApiPropertyOptional({ example: '0.05' }) balanceEth?: string;
}
export class ReadinessResponseDto {
  @ApiProperty({ example: 'ok' }) status!: string;
  @ApiProperty({ example: 'ok' }) database!: string;
  @ApiProperty({ type: RpcReadinessDto }) rpc!: RpcReadinessDto;
  @ApiProperty({ type: ContractReadinessDto }) contracts!: ContractReadinessDto;
  @ApiProperty({ type: RelayerReadinessDto }) relayer!: RelayerReadinessDto;
}
export class PublicChainDto {
  @ApiProperty({ example: 11155111 }) chainId!: number;
  @ApiProperty({ example: 'Sepolia' }) name!: string;
}
export class PublicContractsDto {
  @ApiProperty(address) confidentialPayroll!: string;
  @ApiProperty(address) confidentialToken!: string;
}
export class PublicTokenDto {
  @ApiProperty({ example: 'ctUSDC' }) symbol!: string;
  @ApiProperty({ example: 6 }) decimals!: number;
}
export class PublicFeaturesDto {
  @ApiProperty({ example: true }) nox!: boolean;
  @ApiProperty({ example: true }) safe!: boolean;
  @ApiProperty({ example: true }) testFaucet!: boolean;
}
export class PublicWeb3ConfigResponseDto {
  @ApiProperty({ type: [PublicChainDto] }) chains!: PublicChainDto[];
  @ApiProperty({ type: PublicContractsDto }) contracts!: PublicContractsDto;
  @ApiProperty({ type: PublicTokenDto }) token!: PublicTokenDto;
  @ApiProperty({ type: PublicFeaturesDto }) features!: PublicFeaturesDto;
}
