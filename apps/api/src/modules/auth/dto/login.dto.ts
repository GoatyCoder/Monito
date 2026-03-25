import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin', maxLength: 20 })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  username: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
