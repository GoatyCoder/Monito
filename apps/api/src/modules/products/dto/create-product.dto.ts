import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'UVA', maxLength: 32 })
  @IsString()
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9]+$/, { message: 'Code must contain only letters and numbers' })
  code: string;

  @ApiProperty({ example: 'Uva da tavola', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Uva da tavola italiana' })
  @IsOptional()
  @IsString()
  description?: string;
}
