import type { CreatePackagingDto, Packaging, UpdatePackagingDto } from '@monito/types';
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
