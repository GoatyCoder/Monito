import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, Matches } from 'class-validator';

export class CreateFieldLotDto {
  @ApiProperty({ example: 'LOT2026001', maxLength: 16 })
  @IsString()
  @MaxLength(16)
  @Matches(/^[A-Za-z0-9]+$/, { message: 'Lot code must contain only letters and numbers' })
  lotCode: string;

  @ApiProperty({ example: 'Paolo Rossi', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  supplier: string;

  @ApiProperty()
  @IsString()
  varietyId: string;
}
