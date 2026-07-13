-- Compensation supplied during invitation is encrypted before persistence.
-- The nullable ciphertext preserves compatibility with invitations created
-- before this migration; all new API-created invitations require a salary.
ALTER TABLE "EmployeeInvitation"
ADD COLUMN "salaryCiphertext" BYTEA,
ADD COLUMN "payFrequency" "PayFrequency" NOT NULL DEFAULT 'MONTHLY';
