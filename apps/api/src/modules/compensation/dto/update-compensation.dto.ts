import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class EndCompensationDto {
  @ApiProperty()
  @IsDateString()
  endDate!: string;
}
