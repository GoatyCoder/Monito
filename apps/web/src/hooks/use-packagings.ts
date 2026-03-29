import type { CreatePackagingDto, Packaging, UpdatePackagingDto } from '@monito/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { createResourceCrudHooks, ResourceFilters } from './use-resource-crud';

export type PackagingFilters = ResourceFilters;

const packagingCrud = createResourceCrudHooks<Packaging, CreatePackagingDto, UpdatePackagingDto>(
  'packagings',
  'packagings',
);

export const usePackagings = packagingCrud.useList;
export const usePackaging = packagingCrud.useById;
export const useCreatePackaging = packagingCrud.useCreate;
export const useUpdatePackaging = packagingCrud.useUpdate;
export const useDeletePackaging = packagingCrud.useDelete;
export const useRestorePackaging = packagingCrud.useRestore;
export const usePurgePackaging = packagingCrud.usePurge;

export function useAllPackagings() {
  return useQuery({
    queryKey: ['packagings', 'all'],
    queryFn: async () => {
      const response = await api.get<{ data: Packaging[] }>('/packagings/all');
      return response.data.data;
    },
  });
}
