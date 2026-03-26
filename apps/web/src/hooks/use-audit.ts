import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type AuditOperation =
  | 'CREATE'
  | 'UPDATE'
  | 'SOFT_DELETE'
  | 'RESTORE'
  | 'HARD_DELETE'
  | 'LOGIN'
  | 'LOGOUT';

export interface AuditLogItem {
  id: string;
  userId?: string;
  entity: string;
  entityId: string;
  operation: AuditOperation;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface AuditFilters {
  page?: number;
  limit?: number;
  entity?: string;
  entityId?: string;
  operation?: AuditOperation;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

interface PaginatedAuditResponse {
  data: AuditLogItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function useAuditLogs(filters: AuditFilters = {}) {
  const {
    page = 1,
    limit = 20,
    entity = '',
    entityId = '',
    operation,
    userId = '',
    startDate,
    endDate,
  } = filters;

  return useQuery({
    queryKey: [
      'audit',
      { page, limit, entity, entityId, operation, userId, startDate, endDate },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (entity) params.append('entity', entity);
      if (entityId) params.append('entityId', entityId);
      if (operation) params.append('operation', operation);
      if (userId) params.append('userId', userId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get<PaginatedAuditResponse>(`/audit?${params.toString()}`);
      return response.data;
    },
  });
}
