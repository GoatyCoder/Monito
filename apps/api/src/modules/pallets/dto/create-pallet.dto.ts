import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class PalletItemDto {
  @ApiProperty()
  @IsString()
  processedProductId: string;

  @ApiProperty()
  @IsString()
  packagingId: string;

  @ApiProperty({ minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreatePalletDto {
  @ApiProperty()
  @IsString()
  fieldLotId: string;

  @ApiProperty({ type: [PalletItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PalletItemDto)
  items: PalletItemDto[];

  @ApiPropertyOptional({ description: 'Username of operator', maxLength: 32 })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  createdBy?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  netWeightKg?: number;
}
