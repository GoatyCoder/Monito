import type {
  CreateProcessedProductDto,
  ProcessedProduct,
  UpdateProcessedProductDto,
} from '@monito/types';
import { createResourceCrudHooks, ResourceFilters } from './use-resource-crud';

export type ProcessedProductFilters = ResourceFilters;

const processedProductCrud = createResourceCrudHooks<
  ProcessedProduct,
  CreateProcessedProductDto,
  UpdateProcessedProductDto
>('processed-products', 'processed-products');

export const useProcessedProducts = processedProductCrud.useList;
export const useProcessedProduct = processedProductCrud.useById;
export const useCreateProcessedProduct = processedProductCrud.useCreate;
export const useUpdateProcessedProduct = processedProductCrud.useUpdate;
export const useDeleteProcessedProduct = processedProductCrud.useDelete;
export const useRestoreProcessedProduct = processedProductCrud.useRestore;
export const usePurgeProcessedProduct = processedProductCrud.usePurge;
