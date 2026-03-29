import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type ResourceView = 'active' | 'deleted';

export interface ResourceFilters {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  view?: ResourceView;
}

export interface PaginatedData<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function buildListQueryString(filters: ResourceFilters): string {
  const { page = 1, limit = 20, search = '', sort = '' } = filters;
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  if (search) params.append('search', search);
  if (sort) params.append('sort', sort);
  return params.toString();
}

export function createResourceCrudHooks<TItem, TCreate, TUpdate>(
  resource: string,
  queryKeyBase: string,
) {
  const useList = (filters: ResourceFilters = {}) => {
    const view = filters.view ?? 'active';

    return useQuery({
      queryKey: [queryKeyBase, { ...filters, view }],
      queryFn: async () => {
        const endpoint = view === 'deleted' ? `/${resource}/deleted` : `/${resource}`;
        const query = buildListQueryString(filters);
        const response = await api.get<PaginatedData<TItem>>(`${endpoint}?${query}`);
        return response.data;
      },
    });
  };

  const useById = (id: string, view: ResourceView = 'active') =>
    useQuery({
      queryKey: [queryKeyBase, id, view],
      queryFn: async () => {
        const endpoint = view === 'deleted' ? `/${resource}/deleted/${id}` : `/${resource}/${id}`;
        const response = await api.get<{ data: TItem }>(endpoint);
        return response.data.data;
      },
      enabled: !!id,
    });

  const useCreate = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (data: TCreate) => {
        const response = await api.post<{ data: TItem }>(`/${resource}`, data);
        return response.data.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeyBase] });
      },
    });
  };

  const useUpdate = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, data }: { id: string; data: TUpdate }) => {
        const response = await api.patch<{ data: TItem }>(`/${resource}/${id}`, data);
        return response.data.data;
      },
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: [queryKeyBase] });
        queryClient.invalidateQueries({ queryKey: [queryKeyBase, id] });
      },
    });
  };

  const useDelete = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        await api.delete(`/${resource}/${id}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeyBase] });
      },
    });
  };

  const useRestore = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        const response = await api.post<{ data: TItem }>(`/${resource}/${id}/restore`);
        return response.data.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeyBase] });
      },
    });
  };

  const usePurge = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
        await api.post(`/${resource}/${id}/purge`, { reason });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeyBase] });
      },
    });
  };

  return {
    useList,
    useById,
    useCreate,
    useUpdate,
    useDelete,
    useRestore,
    usePurge,
  };
}
