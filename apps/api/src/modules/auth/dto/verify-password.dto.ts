import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class VerifyPasswordDto {
  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
