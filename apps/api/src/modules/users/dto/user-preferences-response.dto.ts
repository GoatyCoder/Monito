import { ApiProperty } from '@nestjs/swagger';

export class UserPreferencesResponseDto {
  @ApiProperty({ enum: [10, 20, 50, 100], default: 20 })
  masterDataPageSize: 10 | 20 | 50 | 100;

  @ApiProperty({ enum: [10, 20, 50, 100], default: 20 })
  auditLogPageSize: 10 | 20 | 50 | 100;
}
