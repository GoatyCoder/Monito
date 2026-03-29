import { IsOptional, IsString, IsDateString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AuditOperation } from './create-audit-log.dto';

export class AuditQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ enum: AuditOperation })
  @IsOptional()
  @IsEnum(AuditOperation)
  operation?: AuditOperation;

  @ApiPropertyOptional({ description: 'Comma-separated operations list' })
  @IsOptional()
  @IsString()
  operations?: string;

  @ApiPropertyOptional({ description: 'Comma-separated entities list' })
  @IsOptional()
  @IsString()
  entities?: string;

  @ApiPropertyOptional({ description: 'Comma-separated user IDs list' })
  @IsOptional()
  @IsString()
  userIds?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: ['timestamp_desc', 'timestamp_asc'], default: 'timestamp_desc' })
  @IsOptional()
  @IsString()
  sort?: 'timestamp_desc' | 'timestamp_asc';
}
