export interface Variety {
  id: string;
  code: string;
  name: string;
  description?: string;
  productId: string;
  productSubtypeId?: string | null;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface CreateVarietyDto {
  code: string;
  name: string;
  description?: string;
  productId: string;
  productSubtypeId?: string | null;
}

export interface UpdateVarietyDto {
  code?: string;
  name?: string;
  description?: string;
  productId?: string;
  productSubtypeId?: string | null;
}

export interface VarietyResponseDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  productId: string;
  productSubtypeId?: string | null;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface VarietyWithProduct extends VarietyResponseDto {
  productName?: string;
  productSubtypeName?: string;
}
