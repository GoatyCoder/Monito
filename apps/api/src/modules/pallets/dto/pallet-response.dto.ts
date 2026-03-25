import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PalletItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  weightKg: number;

  @ApiProperty()
  processedProductId: string;

  @ApiProperty()
  packagingId: string;

  @ApiProperty()
  createdAt: Date;
}

export class PalletResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  palletNumber: string;

  @ApiProperty()
  netWeightKg: number;

  @ApiProperty()
  fieldLotId: string;

  @ApiProperty()
  createdBy: string;

  @ApiProperty({ type: [PalletItemResponseDto] })
  items: PalletItemResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt: Date | null;
}

export class PalletWithDetailsResponseDto extends PalletResponseDto {
  @ApiProperty({ type: () => Object })
  declare fieldLot: unknown;

  @ApiProperty({ type: () => Object, isArray: true })
  declare items: (PalletItemResponseDto & { processedProduct: unknown; packaging: unknown })[];
}
