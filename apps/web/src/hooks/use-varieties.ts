import type { CreateVarietyDto, UpdateVarietyDto, Variety } from '@monito/types';
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
