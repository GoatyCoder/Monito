import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Matches, Min } from 'class-validator';

export class UpdatePackagingDto {
  @ApiPropertyOptional({ example: 'IFCO6410', maxLength: 14 })
  @IsOptional()
  @IsString()
  @MaxLength(14)
  @Matches(/^[A-Za-z0-9]+$/, { message: 'Code must contain only letters and numbers' })
  code?: string;

  @ApiPropertyOptional({ example: 'IFCO 6410', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Imballaggio in plastica riciclabile' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 0.35, description: 'Tara imballaggio in kg' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  tareKg?: number;

  @ApiPropertyOptional({ example: 600, description: 'Lunghezza esterna in mm' })
  @IsOptional()
  @IsInt()
  @Min(1)
  outerLengthMm?: number;

  @ApiPropertyOptional({ example: 400, description: 'Larghezza esterna in mm' })
  @IsOptional()
  @IsInt()
  @Min(1)
  outerWidthMm?: number;

  @ApiPropertyOptional({ example: 120, description: 'Altezza esterna in mm' })
  @IsOptional()
  @IsInt()
  @Min(1)
  outerHeightMm?: number;
}
