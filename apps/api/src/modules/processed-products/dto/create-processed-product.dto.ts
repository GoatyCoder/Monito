import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, Matches, IsNumber, IsPositive, Length } from 'class-validator';

export class CreateProcessedProductDto {
  @ApiProperty({ example: 'CEST10X500', maxLength: 14 })
  @IsString()
  @MaxLength(14)
  @Matches(/^[A-Za-z0-9]+$/, { message: 'Code must contain only letters and numbers' })
  code: string;

  @ApiProperty({ example: 'Cestino 10x500g', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name: string;

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

  @ApiProperty({ example: 0.5, minimum: 0.001 })
  @IsNumber()
  @IsPositive()
  weightPerBoxKg: number;
}
