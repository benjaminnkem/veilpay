import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { InvitationType, UserRole } from '@repo/types';

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

  @ApiPropertyOptional({ default: 7 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  expiresInDays?: number;
}
