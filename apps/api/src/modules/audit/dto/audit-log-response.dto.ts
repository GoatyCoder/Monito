import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  userId?: string | null;

  @ApiPropertyOptional()
  username?: string | null;

  @ApiPropertyOptional()
  userDisplayName?: string | null;

  @ApiProperty()
  entity: string;

  @ApiProperty()
  entityId: string;

  @ApiProperty()
  operation: string;

  @ApiPropertyOptional()
  oldValue?: Record<string, unknown> | null;

  @ApiPropertyOptional()
  newValue?: Record<string, unknown> | null;

  @ApiPropertyOptional()
  ipAddress?: string | null;

  @ApiPropertyOptional()
  userAgent?: string | null;

  @ApiProperty()
  timestamp: Date;
}
