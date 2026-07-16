import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdatePayrollItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  bonusCents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  allowanceCents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  deductionsCents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;
}
