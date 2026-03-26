export interface Variety {
  id: string;
  code: string;
  name: string;
  description?: string;
  productId: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
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
  deletedAt?: Date | null;
}

export interface VarietyWithProduct extends VarietyResponseDto {
  productName?: string;
}
