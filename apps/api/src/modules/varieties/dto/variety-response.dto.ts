import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VarietyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiProperty()
  productId: string;

  @ApiPropertyOptional({ nullable: true })
  productSubtypeId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt: Date | null;
}
