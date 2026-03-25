export interface FieldLot {
  id: string;
  lotCode: string;
  supplier: string;
  varietyId: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface CreateFieldLotDto {
  lotCode: string;
  supplier: string;
  varietyId: string;
}

export interface UpdateFieldLotDto {
  lotCode?: string;
  supplier?: string;
  varietyId?: string;
}

export interface FieldLotResponseDto {
  id: string;
  lotCode: string;
  supplier: string;
  varietyId: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface FieldLotWithVariety extends FieldLotResponseDto {
  varietyName?: string;
  productName?: string;
}