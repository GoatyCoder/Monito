export interface ProcessedProduct {
  id: string;
  code: string;
  name: string;
  description?: string;
  ean?: string;
  weightPerBoxKg: number;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface CreateProcessedProductDto {
  code: string;
  name: string;
  description?: string;
  ean?: string;
  weightPerBoxKg: number;
}

export interface UpdateProcessedProductDto {
  code?: string;
  name?: string;
  description?: string;
  ean?: string;
  weightPerBoxKg?: number;
}

export interface ProcessedProductResponseDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  ean?: string;
  weightPerBoxKg: number;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
