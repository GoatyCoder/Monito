export interface Packaging {
  id: string;
  code: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface CreatePackagingDto {
  code: string;
  name: string;
  description?: string;
}

export interface UpdatePackagingDto {
  code?: string;
  name?: string;
  description?: string;
}

export interface PackagingResponseDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
