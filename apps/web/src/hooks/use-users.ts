import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  CreateUserDto,
  CreateUserResponse,
  ResetUserPasswordResponse,
  UpdateUserDto,
  User,
} from '@monito/types';

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
}

interface PaginatedUsers {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function buildQueryString(filters: UserFilters): string {
  const params = new URLSearchParams();
  params.append('page', String(filters.page ?? 1));
  params.append('limit', String(filters.limit ?? 20));
  return params.toString();
}

export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      const query = buildQueryString(filters);
      const response = await api.get<PaginatedUsers>(`/users?${query}`);
      const normalized = response.data.data;

      if (!filters.search?.trim()) {
        return response.data;
      }

      const search = filters.search.trim().toLowerCase();
      const filtered = normalized.filter((user) => {
        const fullName = `${user.firstName} ${user.surname}`.toLowerCase();
        return (
          user.username.toLowerCase().includes(search) ||
          fullName.includes(search) ||
          user.role.toLowerCase().includes(search)
        );
      });

      return {
        data: filtered,
        meta: {
          ...response.data.meta,
          total: filtered.length,
          totalPages: 1,
        },
      };
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateUserDto) => {
      const response = await api.post<{ data: CreateUserResponse }>('/users', payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserDto }) => {
      const response = await api.patch<{ data: User }>(`/users/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await api.patch<{ data: User }>(`/users/${id}/status`, { isActive });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<{ data: ResetUserPasswordResponse }>(`/users/${id}/reset-password`);
      return response.data.data;
    },
  });
}
