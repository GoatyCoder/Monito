import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class UpdateUserPreferencesDto {
  @ApiPropertyOptional({ enum: [10, 20, 50, 100], default: 20 })
  @IsOptional()
  @IsIn([10, 20, 50, 100])
  masterDataPageSize?: 10 | 20 | 50 | 100;

  @ApiPropertyOptional({ enum: [10, 20, 50, 100], default: 20 })
  @IsOptional()
  @IsIn([10, 20, 50, 100])
  auditLogPageSize?: 10 | 20 | 50 | 100;
}
