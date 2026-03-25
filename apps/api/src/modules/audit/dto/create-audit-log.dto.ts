import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AuditOperation {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  SOFT_DELETE = 'SOFT_DELETE',
  RESTORE = 'RESTORE',
  HARD_DELETE = 'HARD_DELETE',
}

export class CreateAuditLogDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ enum: AuditOperation })
  @IsEnum(AuditOperation)
  operation: AuditOperation;

  @ApiProperty()
  @IsString()
  entity: string;

  @ApiProperty()
  @IsString()
  entityId: string;

  @ApiPropertyOptional()
  @IsOptional()
  oldValue?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  newValue?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userAgent?: string;
}
