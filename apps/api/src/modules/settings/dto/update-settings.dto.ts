import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  payrollApprovalRequired?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  defaultApprovalSequence?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoGeneratePayrollItems?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notificationEmailEnabled?: boolean;

  @ApiPropertyOptional({ minimum: 1, maximum: 12 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  fiscalYearStartMonth?: number;
}
