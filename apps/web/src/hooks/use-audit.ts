import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type AuditOperation =
  | 'CREATE'
  | 'UPDATE'
  | 'SOFT_DELETE'
  | 'RESTORE'
  | 'HARD_DELETE'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'RESET_PASSWORD'
  | 'STATUS_CHANGE';

export interface AuditLogItem {
  id: string;
  userId?: string;
  username?: string;
  userDisplayName?: string;
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
  operations?: AuditOperation[];
  entities?: string[];
  userIds?: string[];
  userId?: string;
  startDate?: string;
  endDate?: string;
  sort?: 'timestamp_desc' | 'timestamp_asc';
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
    operations,
    entities,
    userIds,
    userId = '',
    startDate,
    endDate,
    sort = 'timestamp_desc',
  } = filters;

  return useQuery({
    queryKey: [
      'audit',
      {
        page,
        limit,
        entity,
        entityId,
        operation,
        operations,
        entities,
        userIds,
        userId,
        startDate,
        endDate,
        sort,
      },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (entity) params.append('entity', entity);
      if (entityId) params.append('entityId', entityId);
      if (operation) params.append('operation', operation);
      if (operations && operations.length > 0) params.append('operations', operations.join(','));
      if (entities && entities.length > 0) params.append('entities', entities.join(','));
      if (userIds && userIds.length > 0) params.append('userIds', userIds.join(','));
      if (userId) params.append('userId', userId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (sort) params.append('sort', sort);

      const response = await api.get<PaginatedAuditResponse>(`/audit?${params.toString()}`);
      return response.data;
    },
  });
}
