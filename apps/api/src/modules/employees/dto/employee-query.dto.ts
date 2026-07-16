import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EmploymentStatus } from '@repo/types';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class EmployeeQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: EmploymentStatus })
  @IsOptional()
  @IsEnum(EmploymentStatus)
  status?: EmploymentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;
}
