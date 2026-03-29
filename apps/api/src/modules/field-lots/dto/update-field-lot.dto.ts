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

  @ApiPropertyOptional({
    example: 'IT',
    description: 'Country code ISO 3166-1 alpha-2',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  @Matches(/^[A-Z]{2}$/, {
    message: 'originCountryCode must be a valid ISO alpha-2 code format',
  })
  originCountryCode?: string;

  @ApiPropertyOptional({
    example: '09',
    description: 'Italian region ISTAT code when originCountryCode is IT',
  })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  originRegion?: string;

  @ApiPropertyOptional({
    example: '052',
    description: 'Italian province ISTAT code when originCountryCode is IT',
  })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  originProvince?: string;

  @ApiPropertyOptional({
    example: '052001',
    description: 'Italian comune ISTAT code when originCountryCode is IT',
  })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  originComune?: string;
}
