import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateProductSubtypeDto {
  @ApiProperty({ example: 'WHITESS', maxLength: 14 })
  @IsString()
  @MaxLength(14)
  @Matches(/^[A-Za-z0-9]+$/, { message: 'Code must contain only letters and numbers' })
  code: string;

  @ApiProperty({ example: 'Bianca senza semi', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  productId: string;
}
