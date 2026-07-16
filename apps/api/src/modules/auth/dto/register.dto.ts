import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({ description: 'Name of the new organization' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  organizationName!: string;
}
