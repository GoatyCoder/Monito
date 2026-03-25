import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class CreatePackagingDto {
  @ApiProperty({ example: 'IFCO6410', maxLength: 32 })
  @IsString()
  @MaxLength(32)
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
}
