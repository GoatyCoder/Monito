export interface FieldLot {
  id: string;
  lotCode: string;
  supplier: string;
  varietyId: string;
  originCountryCode: string;
  originRegion?: string | null;
  originProvince?: string | null;
  originComune?: string | null;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface CreateFieldLotDto {
  lotCode: string;
  supplier: string;
  varietyId: string;
  originCountryCode: string;
  originRegion?: string;
  originProvince?: string;
  originComune?: string;
}

export interface UpdateFieldLotDto {
  lotCode?: string;
  supplier?: string;
  varietyId?: string;
  originCountryCode?: string;
  originRegion?: string;
  originProvince?: string;
  originComune?: string;
}

export interface FieldLotResponseDto {
  id: string;
  lotCode: string;
  supplier: string;
  varietyId: string;
  originCountryCode: string;
  originRegion?: string | null;
  originProvince?: string | null;
  originComune?: string | null;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface FieldLotWithVariety extends FieldLotResponseDto {
  varietyName?: string;
  productName?: string;
}
