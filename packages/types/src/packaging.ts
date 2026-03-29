export interface Packaging {
  id: string;
  code: string;
  name: string;
  description?: string;
  tareKg?: number | null;
  outerLengthMm?: number | null;
  outerWidthMm?: number | null;
  outerHeightMm?: number | null;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface CreatePackagingDto {
  code: string;
  name: string;
  description?: string;
  tareKg: number;
  outerLengthMm: number;
  outerWidthMm: number;
  outerHeightMm: number;
}

export interface UpdatePackagingDto {
  code?: string;
  name?: string;
  description?: string;
  tareKg?: number;
  outerLengthMm?: number;
  outerWidthMm?: number;
  outerHeightMm?: number;
}

export interface PackagingResponseDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  tareKg?: number | null;
  outerLengthMm?: number | null;
  outerWidthMm?: number | null;
  outerHeightMm?: number | null;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
