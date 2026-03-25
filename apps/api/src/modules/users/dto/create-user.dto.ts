import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength, Matches } from 'class-validator';
import { Role } from '../../../../generated/prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'mrossi', maxLength: 32 })
  @IsString()
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9]+$/, { message: 'Username must contain only letters and numbers' })
  username: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Mario', maxLength: 50 })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Rossi', maxLength: 50 })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  surname: string;

  @ApiPropertyOptional({ enum: Role, default: Role.USER })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
