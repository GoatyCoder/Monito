import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class UpdateVarietyDto {
  @ApiPropertyOptional({ maxLength: 14 })
  @IsOptional()
  @IsString()
  @MaxLength(14)
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

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  productSubtypeId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;
}
