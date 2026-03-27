import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateUserPreferencesDto {
  @ApiPropertyOptional({ enum: [10, 20, 50, 100], default: 20 })
  @IsOptional()
  @IsIn([10, 20, 50, 100])
  masterDataPageSize?: 10 | 20 | 50 | 100;

  @ApiPropertyOptional({ enum: [10, 20, 50, 100], default: 20 })
  @IsOptional()
  @IsIn([10, 20, 50, 100])
  auditLogPageSize?: 10 | 20 | 50 | 100;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  lockScreenEnabled?: boolean;

  @ApiPropertyOptional({ minimum: 1, maximum: 120, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  lockScreenTimeoutMinutes?: number;
}
