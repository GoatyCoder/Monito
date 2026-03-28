import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';

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

  @ApiProperty({
    example: 'IT',
    description: 'Country code ISO 3166-1 alpha-2',
  })
  @IsString()
  @MaxLength(2)
  @Matches(/^[A-Z]{2}$/, {
    message: 'originCountryCode must be a valid ISO alpha-2 code format',
  })
  originCountryCode: string;

  @ApiProperty({
    required: false,
    example: '09',
    description: 'Italian region ISTAT code when originCountryCode is IT',
  })
  @IsString()
  @IsOptional()
  @MaxLength(16)
  originRegion?: string;

  @ApiProperty({
    required: false,
    example: '052',
    description: 'Italian province ISTAT code when originCountryCode is IT',
  })
  @IsString()
  @IsOptional()
  @MaxLength(16)
  originProvince?: string;

  @ApiProperty({
    required: false,
    example: '052001',
    description: 'Italian comune ISTAT code when originCountryCode is IT',
  })
  @IsString()
  @IsOptional()
  @MaxLength(16)
  originComune?: string;
}
