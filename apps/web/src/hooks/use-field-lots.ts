import type { CreateFieldLotDto, FieldLot, UpdateFieldLotDto } from '@monito/types';
import { createResourceCrudHooks, ResourceFilters } from './use-resource-crud';

export type FieldLotFilters = ResourceFilters;

const fieldLotCrud = createResourceCrudHooks<FieldLot, CreateFieldLotDto, UpdateFieldLotDto>(
  'field-lots',
  'field-lots',
);

export const useFieldLots = fieldLotCrud.useList;
export const useFieldLot = fieldLotCrud.useById;
export const useCreateFieldLot = fieldLotCrud.useCreate;
export const useUpdateFieldLot = fieldLotCrud.useUpdate;
export const useDeleteFieldLot = fieldLotCrud.useDelete;
export const useRestoreFieldLot = fieldLotCrud.useRestore;
export const usePurgeFieldLot = fieldLotCrud.usePurge;
