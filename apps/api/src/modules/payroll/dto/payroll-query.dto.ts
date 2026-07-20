import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PayrollStatus } from '@repo/types';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class PayrollQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: PayrollStatus })
  @IsOptional()
  @IsEnum(PayrollStatus)
  status?: PayrollStatus;
}
