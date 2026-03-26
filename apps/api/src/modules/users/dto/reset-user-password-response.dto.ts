import { ApiProperty } from '@nestjs/swagger';

export class ResetUserPasswordResponseDto {
  @ApiProperty({ description: 'Temporary alphanumeric password shown only once' })
  temporaryPassword: string;
}
