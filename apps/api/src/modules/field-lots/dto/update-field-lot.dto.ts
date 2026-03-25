import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class UpdateFieldLotDto {
  @ApiPropertyOptional({ maxLength: 16 })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  @Matches(/^[A-Za-z0-9]+$/, { message: 'Lot code must contain only letters and numbers' })
  lotCode?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplier?: string;
}
