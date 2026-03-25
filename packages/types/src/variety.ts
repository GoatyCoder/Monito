export interface Variety {
  id: string;
  code: string;
  name: string;
  description?: string;
  productId: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface CreateVarietyDto {
  code: string;
  name: string;
  description?: string;
  productId: string;
}

export interface UpdateVarietyDto {
  code?: string;
  name?: string;
  description?: string;
  productId?: string;
}

export interface VarietyResponseDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  productId: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface VarietyWithProduct extends VarietyResponseDto {
  productName?: string;
}