export interface ProcessedProduct {
  id: string;
  code: string;
  name: string;
  description?: string;
  ean?: string;
  weightPerBoxKg: number;
  allowedProductIds?: string[];
  allowedSubtypeIds?: string[];
  allowedVarietyIds?: string[];
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
  allowedProductIds?: string[];
  allowedSubtypeIds?: string[];
  allowedVarietyIds?: string[];
}

export interface UpdateProcessedProductDto {
  code?: string;
  name?: string;
  description?: string;
  ean?: string;
  weightPerBoxKg?: number;
  allowedProductIds?: string[];
  allowedSubtypeIds?: string[];
  allowedVarietyIds?: string[];
}

export interface ProcessedProductResponseDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  ean?: string;
  weightPerBoxKg: number;
  allowedProductIds?: string[];
  allowedSubtypeIds?: string[];
  allowedVarietyIds?: string[];
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
