import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AuditOperation {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  SOFT_DELETE = 'SOFT_DELETE',
  RESTORE = 'RESTORE',
  HARD_DELETE = 'HARD_DELETE',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  RESET_PASSWORD = 'RESET_PASSWORD',
  STATUS_CHANGE = 'STATUS_CHANGE',
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
