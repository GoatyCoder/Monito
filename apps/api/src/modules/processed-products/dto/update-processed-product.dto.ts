import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateProcessedProductDto {
  @ApiPropertyOptional({ example: 'CEST10X500', maxLength: 14 })
  @IsOptional()
  @IsString()
  @MaxLength(14)
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

  @ApiPropertyOptional({ type: [String], description: 'Allowed product IDs (OR rule with subtype/variety)' })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  allowedProductIds?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Allowed product subtype IDs (OR rule with product/variety)' })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  allowedSubtypeIds?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Allowed variety IDs (OR rule with product/subtype)' })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  allowedVarietyIds?: string[];
}
