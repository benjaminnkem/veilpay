import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEthereumAddress,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class PageDto {
  @ApiPropertyOptional({ minimum: 1, default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
export class SignupDto {
  @ApiProperty({ example: 'Ada Lovelace', minLength: 2, maxLength: 100 })
  @IsString()
  @Length(2, 100)
  name!: string;
  @ApiProperty({ example: 'ada@example.com', format: 'email' })
  @IsEmail()
  email!: string;
  @ApiProperty({
    example: 'correct-horse-battery-staple',
    minLength: 12,
    writeOnly: true,
  })
  @IsString()
  @MinLength(12)
  password!: string;
}
export class LoginDto {
  @ApiProperty({ example: 'ada@example.com', format: 'email' })
  @IsEmail()
  email!: string;
  @ApiProperty({ example: 'correct-horse-battery-staple', writeOnly: true })
  @IsString()
  password!: string;
}
export class TokenDto {
  @ApiProperty({
    description: 'Single-use opaque token delivered by email.',
    example: 'K7V8...opaque-token',
    minLength: 20,
    writeOnly: true,
  })
  @IsString()
  @MinLength(20)
  token!: string;
}
export class RefreshDto {
  @ApiProperty({
    description: 'Rotating refresh token. Reuse revokes the token family.',
    example: 'eyJhbGciOiJIUzI1NiJ9...',
    writeOnly: true,
  })
  @IsString()
  @MinLength(20)
  refreshToken!: string;
}
export class UpdateMeDto {
  @ApiPropertyOptional({
    example: 'Ada Lovelace',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;
  @ApiPropertyOptional({
    example: 'Analytical Engines Ltd',
    minLength: 2,
    maxLength: 160,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Length(2, 160)
  organizationName?: string;
}
export class WalletChallengeDto {
  @ApiProperty({
    example: '0x1111111111111111111111111111111111111111',
    format: 'ethereum-address',
  })
  @IsEthereumAddress()
  address!: string;
  @ApiProperty({ example: 11155111, description: 'Configured EVM chain ID.' })
  @Type(() => Number)
  @IsInt()
  chainId!: number;
}
export class WalletVerifyDto {
  @ApiProperty({
    example: '49cd81d4-7868-4cb8-9108-e06dd22f6f72',
    format: 'uuid',
  })
  @IsString()
  challengeId!: string;
  @ApiProperty({
    description: 'Exact EIP-4361 message returned by the challenge endpoint.',
  })
  @IsString()
  message!: string;
  @ApiProperty({
    example: '0xabc123...',
    description: 'Wallet signature over the exact SIWE message.',
  })
  @IsString()
  signature!: string;
}
export class CreateCompanyDto {
  @ApiProperty({ example: 'Acme Labs', minLength: 2, maxLength: 160 })
  @IsString()
  @Length(2, 160)
  name!: string;
}
export class UpdateCompanyDto {
  @ApiProperty({ example: 'Acme Labs Nigeria', minLength: 2, maxLength: 160 })
  @IsString()
  @Length(2, 160)
  name!: string;
}
export class TransactionHashDto {
  @ApiProperty({
    example:
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    minLength: 66,
    maxLength: 66,
    format: 'transaction-hash',
  })
  @IsString()
  @Length(66, 66)
  txHash!: `0x${string}`;
}
export class CreateInvitationDto {
  @ApiProperty({ example: 'Grace Hopper', minLength: 2, maxLength: 100 })
  @IsString()
  @Length(2, 100)
  displayName!: string;
  @ApiProperty({ example: 'grace@example.com', format: 'email' })
  @IsEmail()
  email!: string;
}
export class AcceptInvitationDto {
  @ApiProperty({
    description: 'Single-use invitation token delivered by email.',
    writeOnly: true,
  })
  @IsString()
  token!: string;
}
export class UpdateEmployeeDto {
  @ApiPropertyOptional({
    example: 'Grace Hopper',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  displayName?: string;
  @ApiPropertyOptional({
    example: '4250.50',
    description:
      'Positive decimal string with at most six fractional digits. Encrypted before storage.',
    pattern: '^\\d+(\\.\\d{1,6})?$',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  salary?: string;
  @ApiPropertyOptional({
    example: '0x2222222222222222222222222222222222222222',
    format: 'ethereum-address',
  })
  @IsOptional()
  @IsEthereumAddress()
  salaryTokenAddress?: string;
  @ApiPropertyOptional({
    enum: ['WEEKLY', 'BIWEEKLY', 'MONTHLY'],
    example: 'MONTHLY',
  })
  @IsOptional()
  @IsIn(['WEEKLY', 'BIWEEKLY', 'MONTHLY'])
  payFrequency?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
}
export class CreatePayrollDto {
  @ApiProperty({ example: 'July 2026 payroll', minLength: 2, maxLength: 120 })
  @IsString()
  @Length(2, 120)
  label!: string;
  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'Active employee profile IDs. Omit to include every eligible active employee.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  employeeIds?: string[];
  @ApiPropertyOptional({
    minimum: 60,
    maximum: 604800,
    default: 86400,
    example: 86400,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(60)
  @Max(604800)
  expiresInSeconds = 86400;
}
export class UpdatePayrollDto {
  @ApiPropertyOptional({
    example: 'July 2026 corrected payroll',
    minLength: 2,
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  label?: string;
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  employeeIds?: string[];
}
export class ForgotPasswordDto {
  @ApiProperty({ example: 'ada@example.com', format: 'email' })
  @IsEmail()
  email!: string;
}
export class ResetPasswordDto {
  @ApiProperty({
    description: 'Single-use reset token delivered by email.',
    writeOnly: true,
  })
  @IsString()
  @MinLength(20)
  token!: string;
  @ApiProperty({
    example: 'new-correct-horse-battery-staple',
    minLength: 12,
    writeOnly: true,
  })
  @IsString()
  @MinLength(12)
  password!: string;
}
export class ProposeDto {
  @ApiProperty({
    example: '0x1111111111111111111111111111111111111111',
    format: 'ethereum-address',
  })
  @IsEthereumAddress()
  senderAddress!: string;
  @ApiProperty({
    example: '0xabc123...',
    description: 'Safe-owner signature over safeTxHash.',
    writeOnly: true,
  })
  @IsString()
  senderSignature!: string;
}
export class FundingIntentDto {
  @ApiProperty({
    example: '10000000000',
    pattern: '^[0-9]+$',
    description: 'Integer token base units; ctUSDC uses six decimals.',
  })
  @IsString()
  @IsNotEmpty()
  amountBaseUnits!: string;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: ['ADMIN', 'HR', 'FINANCE', 'EMPLOYEE'], example: 'HR' })
  @IsIn(['ADMIN', 'HR', 'FINANCE', 'EMPLOYEE'])
  role!: 'ADMIN' | 'HR' | 'FINANCE' | 'EMPLOYEE';
}
