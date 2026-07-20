import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { CompensationFrequency, InvitationType, UserRole } from '@repo/types';

export class CreateInvitationDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({ enum: InvitationType, default: InvitationType.USER })
  @IsOptional()
  @IsEnum(InvitationType)
  type?: InvitationType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

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

  @ApiPropertyOptional({
    description: 'Starting salary amount in major currency units (e.g. 85000)',
  })
  @ValidateIf(
    (o: CreateInvitationDto) =>
      o.type === InvitationType.EMPLOYEE || o.startingSalary != null,
  )
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  startingSalary?: number;

  @ApiPropertyOptional({
    description: 'Starting salary in cents (alternative to startingSalary)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  startingSalaryCents?: number;

  @ApiPropertyOptional({ default: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  salaryCurrency?: string;

  @ApiPropertyOptional({
    enum: CompensationFrequency,
    default: CompensationFrequency.ANNUALLY,
  })
  @IsOptional()
  @IsEnum(CompensationFrequency)
  salaryFrequency?: CompensationFrequency;

  @ApiPropertyOptional({ default: 7 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  expiresInDays?: number;
}
