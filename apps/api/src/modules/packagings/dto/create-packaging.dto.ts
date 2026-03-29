import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Matches, Min } from 'class-validator';

export class CreatePackagingDto {
  @ApiProperty({ example: 'IFCO6410', maxLength: 14 })
  @IsString()
  @MaxLength(14)
  @Matches(/^[A-Za-z0-9]+$/, { message: 'Code must contain only letters and numbers' })
  code: string;

  @ApiProperty({ example: 'IFCO 6410', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Imballaggio in plastica riciclabile' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 0.35, description: 'Tara imballaggio in kg' })
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  tareKg: number;

  @ApiProperty({ example: 600, description: 'Lunghezza esterna in mm' })
  @IsInt()
  @Min(1)
  outerLengthMm: number;

  @ApiProperty({ example: 400, description: 'Larghezza esterna in mm' })
  @IsInt()
  @Min(1)
  outerWidthMm: number;

  @ApiProperty({ example: 120, description: 'Altezza esterna in mm' })
  @IsInt()
  @Min(1)
  outerHeightMm: number;
}
