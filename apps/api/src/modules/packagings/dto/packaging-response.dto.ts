import { ApiProperty } from '@nestjs/swagger';

export class PackagingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ nullable: true })
  tareKg: number | null;

  @ApiProperty({ nullable: true })
  outerLengthMm: number | null;

  @ApiProperty({ nullable: true })
  outerWidthMm: number | null;

  @ApiProperty({ nullable: true })
  outerHeightMm: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;
}
