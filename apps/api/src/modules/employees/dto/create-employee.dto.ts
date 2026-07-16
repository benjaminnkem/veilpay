import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { EmploymentStatus } from '@repo/types';

export class CreateEmployeeDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  position?: string;

  @ApiPropertyOptional({ enum: EmploymentStatus })
  @IsOptional()
  @IsEnum(EmploymentStatus)
  status?: EmploymentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  walletAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  employeeNumber?: string;
}
