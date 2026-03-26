import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FieldLotResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  lotCode: string;

  @ApiProperty()
  supplier: string;

  @ApiProperty()
  varietyId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt: Date | null;
}

export class FieldLotWithDetailsResponseDto extends FieldLotResponseDto {
  @ApiProperty({ type: () => Object })
  variety: unknown;
}
