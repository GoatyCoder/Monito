export interface ProductSubtype {
  id: string;
  code: string;
  name: string;
  description?: string;
  productId: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface CreateProductSubtypeDto {
  code: string;
  name: string;
  description?: string;
  productId: string;
}

export interface UpdateProductSubtypeDto {
  code?: string;
  name?: string;
  description?: string;
  productId?: string;
}

export interface ProductSubtypeResponseDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  productId: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface ProductSubtypeWithProduct extends ProductSubtypeResponseDto {
  productName?: string;
}
