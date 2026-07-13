-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'HR', 'FINANCE', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('SAFE_NOT_CONFIGURED', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SafeStatus" AS ENUM ('PREDICTED', 'DEPLOYED', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "IntentStatus" AS ENUM ('CREATED', 'AWAITING_USER_SIGNATURE', 'SUBMITTED', 'CONFIRMED', 'VERIFIED', 'EXPIRED', 'FAILED', 'REPLACED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('INVITED', 'ACTIVE', 'INACTIVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "PayFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'PREPARING', 'PREPARED', 'PROPOSING', 'PROPOSED', 'SAFE_APPROVED', 'EXECUTING', 'EXECUTED', 'CANCELLED', 'EXPIRED', 'SAFE_REJECTED', 'FAILED_RETRYABLE', 'FAILED_FINAL');

-- CreateEnum
CREATE TYPE "PayrollItemStatus" AS ENUM ('SNAPSHOTTED', 'PREPARED', 'SUBMITTED', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('CREATED', 'PROPOSED', 'CONFIRMED', 'EXECUTED', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "ChainTxStatus" AS ENUM ('CREATED', 'SUBMITTED', 'MINED', 'FINALIZED', 'REVERTED', 'DROPPED', 'REPLACED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'DEAD');

-- CreateEnum
CREATE TYPE "FundingStatus" AS ENUM ('CREATED', 'SUBMITTED', 'VERIFIED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationName" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "familyId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedById" UUID,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OneTimeToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "purpose" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OneTimeToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "address" VARCHAR(42) NOT NULL,
    "chainType" TEXT NOT NULL DEFAULT 'EVM',
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletChallenge" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "nonceHash" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "address" VARCHAR(42) NOT NULL,
    "domain" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "chainId" BIGINT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "CompanyStatus" NOT NULL DEFAULT 'SAFE_NOT_CONFIGURED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyMember" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "MemberRole" NOT NULL,
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafeAccount" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "chainId" BIGINT NOT NULL,
    "address" VARCHAR(42),
    "predictedAddress" VARCHAR(42) NOT NULL,
    "threshold" INTEGER NOT NULL DEFAULT 1,
    "status" "SafeStatus" NOT NULL DEFAULT 'PREDICTED',
    "deploymentTxHash" VARCHAR(66),
    "deployedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafeAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafeDeploymentIntent" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "safeAccountId" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "chainId" BIGINT NOT NULL,
    "to" VARCHAR(42) NOT NULL,
    "value" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "predictedAddress" VARCHAR(42) NOT NULL,
    "saltNonce" TEXT NOT NULL,
    "status" "IntentStatus" NOT NULL DEFAULT 'AWAITING_USER_SIGNATURE',
    "txHash" VARCHAR(66),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafeDeploymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundingIntent" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "chainId" BIGINT NOT NULL,
    "to" VARCHAR(42) NOT NULL,
    "value" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "amountBaseUnits" TEXT NOT NULL,
    "status" "FundingStatus" NOT NULL DEFAULT 'CREATED',
    "txHash" VARCHAR(66),
    "balanceHandle" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundingIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeInvitation" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "inviterUserId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'EMPLOYEE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeProfile" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "companyMemberId" UUID NOT NULL,
    "walletId" UUID,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'INVITED',
    "salaryCiphertext" BYTEA,
    "salaryCurrency" TEXT NOT NULL DEFAULT 'ctUSDC',
    "salaryTokenAddress" VARCHAR(42),
    "payFrequency" "PayFrequency" NOT NULL DEFAULT 'MONTHLY',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRun" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "safeAccountId" UUID NOT NULL,
    "chainId" BIGINT NOT NULL,
    "tokenAddress" VARCHAR(42) NOT NULL,
    "payrollContractAddress" VARCHAR(42) NOT NULL,
    "label" TEXT NOT NULL,
    "onchainPayrollId" VARCHAR(66) NOT NULL,
    "manifestVersion" INTEGER NOT NULL DEFAULT 1,
    "manifestHash" VARCHAR(66),
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3),
    "safeTxHash" VARCHAR(66),
    "safeExecutionTxHash" VARCHAR(66),
    "executionTxHash" VARCHAR(66),
    "preparedAt" TIMESTAMP(3),
    "proposedAt" TIMESTAMP(3),
    "safeApprovedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollItem" (
    "id" UUID NOT NULL,
    "payrollRunId" UUID NOT NULL,
    "employeeProfileId" UUID NOT NULL,
    "itemIndex" INTEGER NOT NULL,
    "recipientAddress" VARCHAR(42) NOT NULL,
    "salaryCiphertextSnapshot" BYTEA NOT NULL,
    "encryptedHandle" TEXT,
    "inputProof" BYTEA,
    "handleHash" VARCHAR(66),
    "transferResultHandle" TEXT,
    "status" "PayrollItemStatus" NOT NULL DEFAULT 'SNAPSHOTTED',
    "txHash" VARCHAR(66),
    "blockNumber" BIGINT,
    "logIndex" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafeTransactionProposal" (
    "id" UUID NOT NULL,
    "payrollRunId" UUID NOT NULL,
    "safeAddress" VARCHAR(42) NOT NULL,
    "safeTxHash" VARCHAR(66) NOT NULL,
    "transactionJson" JSONB NOT NULL,
    "senderAddress" VARCHAR(42),
    "senderSignature" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'CREATED',
    "confirmationsRequired" INTEGER NOT NULL DEFAULT 1,
    "confirmationsReceived" INTEGER NOT NULL DEFAULT 0,
    "onchainTxHash" VARCHAR(66),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafeTransactionProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockchainTransaction" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "relatedType" TEXT NOT NULL,
    "relatedId" TEXT NOT NULL,
    "chainId" BIGINT NOT NULL,
    "txHash" VARCHAR(66) NOT NULL,
    "fromAddress" VARCHAR(42),
    "toAddress" VARCHAR(42),
    "functionName" TEXT NOT NULL,
    "status" "ChainTxStatus" NOT NULL DEFAULT 'SUBMITTED',
    "blockNumber" BIGINT,
    "blockHash" VARCHAR(66),
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "failureCategory" TEXT,
    "sanitizedReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "minedAt" TIMESTAMP(3),
    "finalizedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockchainTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "id" UUID NOT NULL,
    "companyId" UUID,
    "userId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorUserId" UUID,
    "companyId" UUID,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DurableJob" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 8,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DurableJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_emailNormalized_key" ON "User"("emailNormalized");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_revokedAt_idx" ON "Session"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "Session_familyId_idx" ON "Session"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "OneTimeToken_tokenHash_key" ON "OneTimeToken"("tokenHash");

-- CreateIndex
CREATE INDEX "OneTimeToken_userId_purpose_idx" ON "OneTimeToken"("userId", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_address_key" ON "Wallet"("address");

-- CreateIndex
CREATE INDEX "Wallet_userId_isPrimary_idx" ON "Wallet"("userId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "WalletChallenge_nonceHash_key" ON "WalletChallenge"("nonceHash");

-- CreateIndex
CREATE INDEX "WalletChallenge_userId_expiresAt_idx" ON "WalletChallenge"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "Company_status_createdAt_idx" ON "Company"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CompanyMember_companyId_role_status_idx" ON "CompanyMember"("companyId", "role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyMember_companyId_userId_key" ON "CompanyMember"("companyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SafeAccount_companyId_chainId_key" ON "SafeAccount"("companyId", "chainId");

-- CreateIndex
CREATE UNIQUE INDEX "SafeAccount_chainId_address_key" ON "SafeAccount"("chainId", "address");

-- CreateIndex
CREATE INDEX "SafeDeploymentIntent_companyId_status_idx" ON "SafeDeploymentIntent"("companyId", "status");

-- CreateIndex
CREATE INDEX "FundingIntent_companyId_status_idx" ON "FundingIntent"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeInvitation_tokenHash_key" ON "EmployeeInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "EmployeeInvitation_companyId_status_createdAt_idx" ON "EmployeeInvitation"("companyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "EmployeeInvitation_emailNormalized_status_idx" ON "EmployeeInvitation"("emailNormalized", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_companyMemberId_key" ON "EmployeeProfile"("companyMemberId");

-- CreateIndex
CREATE INDEX "EmployeeProfile_companyId_employmentStatus_createdAt_idx" ON "EmployeeProfile"("companyId", "employmentStatus", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_companyId_userId_key" ON "EmployeeProfile"("companyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRun_onchainPayrollId_key" ON "PayrollRun"("onchainPayrollId");

-- CreateIndex
CREATE INDEX "PayrollRun_companyId_status_createdAt_idx" ON "PayrollRun"("companyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PayrollItem_employeeProfileId_status_idx" ON "PayrollItem"("employeeProfileId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollItem_payrollRunId_itemIndex_key" ON "PayrollItem"("payrollRunId", "itemIndex");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollItem_payrollRunId_recipientAddress_key" ON "PayrollItem"("payrollRunId", "recipientAddress");

-- CreateIndex
CREATE UNIQUE INDEX "SafeTransactionProposal_payrollRunId_key" ON "SafeTransactionProposal"("payrollRunId");

-- CreateIndex
CREATE UNIQUE INDEX "SafeTransactionProposal_safeTxHash_key" ON "SafeTransactionProposal"("safeTxHash");

-- CreateIndex
CREATE INDEX "BlockchainTransaction_companyId_status_submittedAt_idx" ON "BlockchainTransaction"("companyId", "status", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainTransaction_chainId_txHash_key" ON "BlockchainTransaction"("chainId", "txHash");

-- CreateIndex
CREATE INDEX "IdempotencyKey_expiresAt_idx" ON "IdempotencyKey"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_userId_operation_key_key" ON "IdempotencyKey"("userId", "operation", "key");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_createdAt_idx" ON "AuditLog"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "DurableJob_status_runAt_idx" ON "DurableJob"("status", "runAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletChallenge" ADD CONSTRAINT "WalletChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafeAccount" ADD CONSTRAINT "SafeAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafeDeploymentIntent" ADD CONSTRAINT "SafeDeploymentIntent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafeDeploymentIntent" ADD CONSTRAINT "SafeDeploymentIntent_safeAccountId_fkey" FOREIGN KEY ("safeAccountId") REFERENCES "SafeAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafeDeploymentIntent" ADD CONSTRAINT "SafeDeploymentIntent_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundingIntent" ADD CONSTRAINT "FundingIntent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeInvitation" ADD CONSTRAINT "EmployeeInvitation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeInvitation" ADD CONSTRAINT "EmployeeInvitation_inviterUserId_fkey" FOREIGN KEY ("inviterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_companyMemberId_fkey" FOREIGN KEY ("companyMemberId") REFERENCES "CompanyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRun" ADD CONSTRAINT "PayrollRun_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRun" ADD CONSTRAINT "PayrollRun_safeAccountId_fkey" FOREIGN KEY ("safeAccountId") REFERENCES "SafeAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRun" ADD CONSTRAINT "PayrollRun_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_employeeProfileId_fkey" FOREIGN KEY ("employeeProfileId") REFERENCES "EmployeeProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafeTransactionProposal" ADD CONSTRAINT "SafeTransactionProposal_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockchainTransaction" ADD CONSTRAINT "BlockchainTransaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyKey" ADD CONSTRAINT "IdempotencyKey_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
