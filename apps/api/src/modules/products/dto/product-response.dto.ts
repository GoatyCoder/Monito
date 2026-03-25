import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  updatedAt: Date;
}

export class ProductWithVarietiesResponseDto extends ProductResponseDto {
  @ApiProperty({ type: () => Object, isArray: true })
  varieties: unknown[];
}
