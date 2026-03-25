import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID, ValidateNested, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class PalletItemDto {
  @ApiProperty()
  @IsUUID()
  processedProductId: string;

  @ApiProperty()
  @IsUUID()
  packagingId: string;

  @ApiProperty({ minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreatePalletDto {
  @ApiProperty()
  @IsUUID()
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
  @IsNumber()
  @Min(0)
  netWeightKg?: number;
}
