import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class PurgeRequestDto {
  @ApiProperty({
    example: 'Record created by mistake during data entry',
    minLength: 3,
    maxLength: 500,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason: string;
}
