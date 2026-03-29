import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductSubtypeResponseDto {
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

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt: Date | null;
}
