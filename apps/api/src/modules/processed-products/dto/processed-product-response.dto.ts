import { ApiProperty } from '@nestjs/swagger';

export class ProcessedProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ nullable: true })
  ean: string | null;

  @ApiProperty()
  weightPerBoxKg: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  @ApiProperty({ type: [String] })
  allowedProductIds: string[];

  @ApiProperty({ type: [String] })
  allowedSubtypeIds: string[];

  @ApiProperty({ type: [String] })
  allowedVarietyIds: string[];
}
