import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, Matches } from 'class-validator';
import { AvatarColor } from '../../../../generated/prisma/client';

export class UpdateMeDto {
  @ApiPropertyOptional({ maxLength: 32 })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9]+$/, { message: 'Username must contain only letters and numbers' })
  username?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  surname?: string;

  @ApiPropertyOptional({ enum: AvatarColor })
  @IsOptional()
  @IsEnum(AvatarColor)
  avatarColor?: AvatarColor;
}
