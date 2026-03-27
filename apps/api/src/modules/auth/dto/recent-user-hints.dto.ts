import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsString } from 'class-validator';
import { AvatarColor } from '../../../../generated/prisma/client';

export class RecentUserHintsRequestDto {
  @ApiProperty({ type: [String], maxItems: 5 })
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  userIds: string[];
}

export class RecentUserHintDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  surname: string;

  @ApiProperty({ enum: AvatarColor, required: false })
  avatarColor?: string;

  @ApiProperty()
  isActive: boolean;
}
