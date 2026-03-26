import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, Matches, IsNumber, IsPositive, Length } from 'class-validator';

export class UpdateProcessedProductDto {
  @ApiPropertyOptional({ example: 'CEST10X500', maxLength: 32 })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9]+$/, { message: 'Code must contain only letters and numbers' })
  code?: string;

  @ApiPropertyOptional({ example: 'Cestino 10x500g', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Cestino in plastica 500g' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '1234567890123', description: 'EAN-13, exactly 13 digits' })
  @IsOptional()
  @IsString()
  @Length(13, 13)
  @Matches(/^[0-9]{13}$/, { message: 'EAN must be exactly 13 digits' })
  ean?: string;

  @ApiPropertyOptional({ example: 0.5, minimum: 0.001 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  weightPerBoxKg?: number;
}
