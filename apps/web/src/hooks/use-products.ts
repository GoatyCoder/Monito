import type { CreateProductDto, Product, UpdateProductDto } from '@monito/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { createResourceCrudHooks, ResourceFilters } from './use-resource-crud';

export type ProductFilters = ResourceFilters;

const productCrud = createResourceCrudHooks<Product, CreateProductDto, UpdateProductDto>(
  'products',
  'products',
);

export const useProducts = productCrud.useList;
export const useProduct = productCrud.useById;
export const useCreateProduct = productCrud.useCreate;
export const useUpdateProduct = productCrud.useUpdate;
export const useDeleteProduct = productCrud.useDelete;
export const useRestoreProduct = productCrud.useRestore;
export const usePurgeProduct = productCrud.usePurge;

export function useAllProducts() {
  return useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      const response = await api.get<{ data: Product[] }>('/products/all');
      return response.data.data;
    },
  });
}
