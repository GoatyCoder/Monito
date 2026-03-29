import type { CreateVarietyDto, UpdateVarietyDto, Variety } from '@monito/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { createResourceCrudHooks, ResourceFilters } from './use-resource-crud';

export type VarietyFilters = ResourceFilters;

const varietyCrud = createResourceCrudHooks<Variety, CreateVarietyDto, UpdateVarietyDto>(
  'varieties',
  'varieties',
);

export const useVarieties = varietyCrud.useList;
export const useVariety = varietyCrud.useById;
export const useCreateVariety = varietyCrud.useCreate;
export const useUpdateVariety = varietyCrud.useUpdate;
export const useDeleteVariety = varietyCrud.useDelete;
export const useRestoreVariety = varietyCrud.useRestore;
export const usePurgeVariety = varietyCrud.usePurge;

export function useAllVarieties() {
  return useQuery({
    queryKey: ['varieties', 'all'],
    queryFn: async () => {
      const response = await api.get<{ data: Variety[] }>('/varieties/all');
      return response.data.data;
    },
  });
}
