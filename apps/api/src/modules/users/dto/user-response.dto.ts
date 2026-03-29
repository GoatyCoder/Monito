import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Role, AvatarColor } from '../../../../generated/prisma/client';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  surname: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  mustChangePassword: boolean;

  @ApiPropertyOptional({ enum: AvatarColor })
  @Expose()
  avatarColor?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;

  @ApiPropertyOptional()
  lastLoginAt?: Date | null;
}
