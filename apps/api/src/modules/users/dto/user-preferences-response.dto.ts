import { ApiProperty } from '@nestjs/swagger';

export class UserPreferencesResponseDto {
  @ApiProperty({ enum: [10, 20, 50, 100], default: 20 })
  masterDataPageSize: 10 | 20 | 50 | 100;

  @ApiProperty({ enum: [10, 20, 50, 100], default: 20 })
  auditLogPageSize: 10 | 20 | 50 | 100;

  @ApiProperty({ default: true })
  lockScreenEnabled: boolean;

  @ApiProperty({ minimum: 1, maximum: 120, default: 5 })
  lockScreenTimeoutMinutes: number;
}
