import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Product, CreateProductDto, UpdateProductDto } from '@monito/types';

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

export function useProducts(filters: ProductFilters = {}) {
  const { page = 1, limit = 20, search = '', sort = '' } = filters;
  
  return useQuery({
    queryKey: ['products', { page, limit, search, sort }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (search) params.append('search', search);
      if (sort) params.append('sort', sort);
      
      const response = await api.get<{ data: Product[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(`/products?${params.toString()}`);
      return response.data;
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const response = await api.get<{ data: Product }>(`/products/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProductDto) => {
      const response = await api.post<{ data: Product }>('/products', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductDto }) => {
      const response = await api.patch<{ data: Product }>(`/products/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}