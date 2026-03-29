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

  @ApiProperty({ description: 'Country code ISO 3166-1 alpha-2' })
  originCountryCode: string;

  @ApiPropertyOptional({ description: 'Italian region ISTAT code when applicable' })
  originRegion: string | null;

  @ApiPropertyOptional({ description: 'Italian province ISTAT code when applicable' })
  originProvince: string | null;

  @ApiPropertyOptional({ description: 'Italian comune ISTAT code when applicable' })
  originComune: string | null;

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
