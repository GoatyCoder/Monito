import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min } from 'class-validator';

export class UpdatePalletDto {
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  netWeightKg?: number;
}
