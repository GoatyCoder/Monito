import type {
  CreateProductSubtypeDto,
  ProductSubtype,
  UpdateProductSubtypeDto,
} from '@monito/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { createResourceCrudHooks, ResourceFilters } from './use-resource-crud';

export type ProductSubtypeFilters = ResourceFilters;

const productSubtypeCrud = createResourceCrudHooks<
  ProductSubtype,
  CreateProductSubtypeDto,
  UpdateProductSubtypeDto
>('product-subtypes', 'product-subtypes');

export const useProductSubtypes = productSubtypeCrud.useList;
export const useProductSubtype = productSubtypeCrud.useById;
export const useCreateProductSubtype = productSubtypeCrud.useCreate;
export const useUpdateProductSubtype = productSubtypeCrud.useUpdate;
export const useDeleteProductSubtype = productSubtypeCrud.useDelete;
export const useRestoreProductSubtype = productSubtypeCrud.useRestore;
export const usePurgeProductSubtype = productSubtypeCrud.usePurge;

export function useAllProductSubtypes() {
  return useQuery({
    queryKey: ['product-subtypes', 'all'],
    queryFn: async () => {
      const response = await api.get<{ data: ProductSubtype[] }>('/product-subtypes/all');
      return response.data.data;
    },
  });
}

export function useProductSubtypesByProduct(productId: string) {
  return useQuery({
    queryKey: ['product-subtypes', 'by-product', productId],
    queryFn: async () => {
      const response = await api.get<{ data: ProductSubtype[] }>(
        `/products/${productId}/subtypes/all`,
      );
      return response.data.data;
    },
    enabled: !!productId,
  });
}
