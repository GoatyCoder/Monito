export interface Pallet {
  id: string;
  palletNumber: string;
  netWeightKg: number;
  fieldLotId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface CreatePalletItemDto {
  processedProductId: string;
  packagingId: string;
  quantity: number;
}

export interface CreatePalletDto {
  fieldLotId: string;
  items: CreatePalletItemDto[];
  createdBy?: string;
  netWeightKg?: number;
}

export interface UpdatePalletDto {
  palletNumber?: string;
  netWeightKg?: number;
  fieldLotId?: string;
}

export interface PalletResponseDto {
  id: string;
  palletNumber: string;
  netWeightKg: number;
  fieldLotId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface PalletItem {
  id: string;
  quantity: number;
  weightKg: number;
  palletId: string;
  processedProductId: string;
  packagingId: string;
  createdAt: Date;
}
