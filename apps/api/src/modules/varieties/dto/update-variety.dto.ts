import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class UpdateVarietyDto {
  @ApiPropertyOptional({ maxLength: 32 })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9]+$/, { message: 'Code must contain only letters and numbers' })
  code?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
