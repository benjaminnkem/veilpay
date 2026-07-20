import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { CompensationFrequency, CompensationType } from '@repo/types';

export class CreateCompensationDto {
  @ApiProperty()
  @IsUUID()
  employeeId!: string;

  @ApiProperty({ enum: CompensationType })
  @IsEnum(CompensationType)
  type!: CompensationType;

  @ApiProperty({ description: 'Amount in cents' })
  @IsInt()
  @Min(0)
  amountCents!: number;

  @ApiPropertyOptional({ default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ enum: CompensationFrequency })
  @IsEnum(CompensationFrequency)
  frequency!: CompensationFrequency;

  @ApiProperty()
  @IsDateString()
  effectiveDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
