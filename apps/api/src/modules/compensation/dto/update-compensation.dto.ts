import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CompensationFrequency, CompensationType } from '@repo/types';

export class UpdateCompensationDto {
  @ApiPropertyOptional({ enum: CompensationType })
  @IsOptional()
  @IsEnum(CompensationType)
  type?: CompensationType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  amountCents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ enum: CompensationFrequency })
  @IsOptional()
  @IsEnum(CompensationFrequency)
  frequency?: CompensationFrequency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class EndCompensationDto {
  @ApiPropertyOptional()
  @IsDateString()
  endDate!: string;
}
