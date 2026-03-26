import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';

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
}
