export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface CreateProductDto {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateProductDto {
  code?: string;
  name?: string;
  description?: string;
}

export interface ProductResponseDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}