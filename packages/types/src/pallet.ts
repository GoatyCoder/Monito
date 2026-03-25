export interface Pallet {
  id: string;
  palletNumber: string;
  netWeightKg: number;
  fieldLotId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface CreatePalletDto {
  palletNumber: string;
  netWeightKg: number;
  fieldLotId: string;
  createdBy: string;
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