import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { OrganizationStatus } from '@repo/types';

export class UpdateOrganizationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalName?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  taxId?: string | null;

  @ApiPropertyOptional({ enum: OrganizationStatus })
  @IsOptional()
  @IsEnum(OrganizationStatus)
  status?: OrganizationStatus;

  @ApiPropertyOptional({
    description: 'Safe smart account address used as organization treasury',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  safeAddress?: string | null;

  @ApiPropertyOptional({
    description: 'Network key, e.g. sepolia | base-sepolia | base | ethereum',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  network?: string | null;

  @ApiPropertyOptional({ enum: ['mock', 'blockchain', 'nox'] })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  executionProvider?: string | null;

  @ApiPropertyOptional({
    description:
      'ERC-7984 confidential token (or ERC-20 wrapper) used for Nox payroll on Sepolia',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  confidentialTokenAddress?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  logoUrl?: string | null;
}
