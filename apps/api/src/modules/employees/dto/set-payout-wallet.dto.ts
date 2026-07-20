import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SetPayoutWalletDto {
  @ApiProperty({ description: 'Ethereum address for payroll payouts' })
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'walletAddress must be a valid 0x-prefixed address',
  })
  walletAddress!: string;

  @ApiProperty({
    description: 'EIP-191 personal_sign signature proving ownership of the wallet',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  signature!: string;

  @ApiProperty({
    description: 'Exact message that was signed (must match server challenge format)',
  })
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  message!: string;

  @ApiPropertyOptional({
    description: 'ISO timestamp embedded in the message (for freshness checks)',
  })
  @IsOptional()
  @IsString()
  signedAt?: string;
}
