import type { CreateFieldLotDto, FieldLot, UpdateFieldLotDto } from '@monito/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
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

export function useAllFieldLots() {
  return useQuery({
    queryKey: ['field-lots', 'all'],
    queryFn: async () => {
      const response = await api.get<{ data: FieldLot[] }>('/field-lots/all');
      return response.data.data;
    },
  });
}
