import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { Pagination } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuditLogs, type AuditFilters, type AuditLogItem, type AuditOperation } from '@/hooks/use-audit';
import { useAuth } from '@/contexts/auth-context';
import { useUsers } from '@/hooks/use-users';
import { showError, showSuccess } from '@/lib/toast';

type TimePreset = 'today' | 'last24h' | 'last7d' | 'custom';

const operationOptions: { value: AuditOperation; label: string; color: string }[] = [
  { value: 'CREATE', label: 'Creazione', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'UPDATE', label: 'Modifica', color: 'bg-blue-100 text-blue-800' },
  { value: 'SOFT_DELETE', label: 'Eliminazione', color: 'bg-amber-100 text-amber-800' },
  { value: 'RESTORE', label: 'Ripristino', color: 'bg-green-100 text-green-800' },
  { value: 'HARD_DELETE', label: 'Purge', color: 'bg-red-100 text-red-800' },
  { value: 'LOGIN_SUCCESS', label: 'Login OK', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'LOGIN_FAILED', label: 'Login KO', color: 'bg-red-100 text-red-800' },
  { value: 'LOGOUT', label: 'Logout', color: 'bg-slate-100 text-slate-800' },
  { value: 'PASSWORD_CHANGE', label: 'Cambio password', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'RESET_PASSWORD', label: 'Reset password', color: 'bg-fuchsia-100 text-fuchsia-800' },
  { value: 'STATUS_CHANGE', label: 'Cambio stato', color: 'bg-orange-100 text-orange-800' },
];

const entityRouteMap: Record<string, string> = {
  Product: '/products',
  Variety: '/varieties',
  Packaging: '/packagings',
  ProcessedProduct: '/processed-products',
  FieldLot: '/field-lots',
  Pallet: '/pallets',
  User: '/users',
};

function getOperationLabel(operation: AuditOperation): string {
  return operationOptions.find((item) => item.value === operation)?.label ?? operation;
}

function getOperationColor(operation: AuditOperation): string {
  return operationOptions.find((item) => item.value === operation)?.color ?? 'bg-slate-100 text-slate-800';
}

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function deriveDateRange(preset: TimePreset): { startDate?: string; endDate?: string } {
  const now = new Date();

  if (preset === 'today') {
    return {
      startDate: toIsoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate())),
      endDate: toIsoDate(now),
    };
  }

  if (preset === 'last24h') {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return {
      startDate: toIsoDate(yesterday),
      endDate: toIsoDate(now),
    };
  }

  if (preset === 'last7d') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      startDate: toIsoDate(weekAgo),
      endDate: toIsoDate(now),
    };
  }

  return {};
}

function parseCsvParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function AuditPage() {
  const { preferences } = useAuth();
  const { data: usersData } = useUsers({ page: 1, limit: 100 });

  const initialSearch = new URLSearchParams(window.location.search);

  const [timePreset, setTimePreset] = useState<TimePreset>(
    (initialSearch.get('preset') as TimePreset) || 'last7d',
  );

  const [filters, setFilters] = useState<AuditFilters>({
    page: Number(initialSearch.get('page') || '1'),
    limit: preferences.auditLogPageSize,
    entityId: initialSearch.get('entityId') || '',
    operations: parseCsvParam(initialSearch.get('operations')) as AuditOperation[],
    entities: parseCsvParam(initialSearch.get('entities')),
    userIds: parseCsvParam(initialSearch.get('userIds')),
    startDate: initialSearch.get('startDate') || '',
    endDate: initialSearch.get('endDate') || '',
    sort: (initialSearch.get('sort') as 'timestamp_desc' | 'timestamp_asc') || 'timestamp_desc',
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', String(filters.page ?? 1));
    if (filters.entityId) params.set('entityId', filters.entityId);
    if (filters.operations && filters.operations.length > 0) params.set('operations', filters.operations.join(','));
    if (filters.entities && filters.entities.length > 0) params.set('entities', filters.entities.join(','));
    if (filters.userIds && filters.userIds.length > 0) params.set('userIds', filters.userIds.join(','));
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.sort) params.set('sort', filters.sort);
    params.set('preset', timePreset);

    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, '', nextUrl);
  }, [filters, timePreset]);

  useEffect(() => {
    if (timePreset === 'custom') return;
    const range = deriveDateRange(timePreset);
    setFilters((prev) => ({ ...prev, ...range, page: 1 }));
  }, [timePreset]);

  const { data, isLoading } = useAuditLogs(filters);

  const userOptions = usersData?.data ?? [];
  const entityOptions = useMemo(() => {
    const fromData = data?.data.map((item) => item.entity) ?? [];
    const fromMap = Object.keys(entityRouteMap);
    return [...new Set([...fromMap, ...fromData])].sort();
  }, [data?.data]);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleMultiSelect = useCallback((key: 'operations' | 'entities' | 'userIds', values: string[]) => {
    setFilters((prev) => ({ ...prev, [key]: values, page: 1 }));
  }, []);

  const copyText = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showSuccess(successMessage);
    } catch {
      showError('Copia non riuscita');
    }
  };

  const resetFilters = () => {
    setTimePreset('last7d');
    const range = deriveDateRange('last7d');
    setFilters({
      page: 1,
      limit: preferences.auditLogPageSize,
      entityId: '',
      operations: [],
      entities: [],
      userIds: [],
      startDate: range.startDate,
      endDate: range.endDate,
      sort: 'timestamp_desc',
    });
    setExpandedId(null);
  };

  const openEntityRoute = (item: AuditLogItem) => {
    const route = entityRouteMap[item.entity];
    if (!route) return;
    window.location.assign(route);
  };

  return (
    <div className="space-y-4" id="main-content" role="main" aria-label="Audit log">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
        <Button variant="outline" onClick={resetFilters}>Reset filtri</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 border rounded-md p-4">
        <div className="space-y-2">
          <Label htmlFor="audit-time-preset">Preset tempo</Label>
          <select
            id="audit-time-preset"
            value={timePreset}
            onChange={(e) => setTimePreset(e.target.value as TimePreset)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="today">Oggi</option>
            <option value="last24h">Ultime 24h</option>
            <option value="last7d">Ultimi 7 giorni</option>
            <option value="custom">Intervallo custom</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="audit-sort">Ordinamento timestamp</Label>
          <select
            id="audit-sort"
            value={filters.sort || 'timestamp_desc'}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                sort: e.target.value as 'timestamp_desc' | 'timestamp_asc',
                page: 1,
              }))
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="timestamp_desc">Piu recenti</option>
            <option value="timestamp_asc">Piu vecchi</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="audit-entity-id">Entity ID</Label>
          <input
            id="audit-entity-id"
            value={filters.entityId || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, entityId: e.target.value, page: 1 }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Filtra per ID risorsa"
          />
        </div>

        {timePreset === 'custom' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="audit-start-date">Data inizio</Label>
              <input
                id="audit-start-date"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value, page: 1 }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audit-end-date">Data fine</Label>
              <input
                id="audit-end-date"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value, page: 1 }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="audit-operations">Operazioni (multi)</Label>
          <select
            id="audit-operations"
            multiple
            value={filters.operations || []}
            onChange={(e) =>
              handleMultiSelect(
                'operations',
                Array.from(e.target.selectedOptions).map((option) => option.value),
              )
            }
            className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {operationOptions.map((operation) => (
              <option key={operation.value} value={operation.value}>
                {operation.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="audit-entities">Entità (multi)</Label>
          <select
            id="audit-entities"
            multiple
            value={filters.entities || []}
            onChange={(e) =>
              handleMultiSelect(
                'entities',
                Array.from(e.target.selectedOptions).map((option) => option.value),
              )
            }
            className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {entityOptions.map((entity) => (
              <option key={entity} value={entity}>
                {entity}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="audit-users">Utenti (multi)</Label>
          <select
            id="audit-users"
            multiple
            value={filters.userIds || []}
            onChange={(e) =>
              handleMultiSelect(
                'userIds',
                Array.from(e.target.selectedOptions).map((option) => option.value),
              )
            }
            className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {userOptions.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.surname} ({user.username})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border rounded-md" role="region" aria-label="Tabella audit log">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Operazione</TableHead>
              <TableHead>Entità</TableHead>
              <TableHead>Risorsa</TableHead>
              <TableHead>Utente</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8" aria-busy="true" aria-live="polite">
                  Caricamento...
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-foreground-muted">
                  Nessun evento audit trovato
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((item) => (
                <Fragment key={item.id}>
                  <TableRow>
                    <TableCell>{new Date(item.timestamp).toLocaleString('it-IT')}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getOperationColor(item.operation)}`}>
                        {getOperationLabel(item.operation)}
                      </span>
                    </TableCell>
                    <TableCell>{item.entity}</TableCell>
                    <TableCell>{item.entityId}</TableCell>
                    <TableCell>{item.userDisplayName || item.username || item.userId || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
                        >
                          {expandedId === item.id ? 'Nascondi' : 'Dettaglio'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!entityRouteMap[item.entity]}
                          onClick={() => openEntityRoute(item)}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Apri risorsa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedId === item.id && (
                    <TableRow key={`${item.id}-details`}>
                      <TableCell colSpan={6} className="bg-slate-50">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold">Old value</h3>
                              {item.oldValue !== undefined && item.oldValue !== null && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyText(JSON.stringify(item.oldValue, null, 2), 'Old value copiato')}
                                >
                                  <Copy className="w-4 h-4 mr-1" />
                                  Copia
                                </Button>
                              )}
                            </div>
                            <pre className="rounded-md border border-border bg-white p-3 text-xs overflow-auto max-h-72">
                              {item.oldValue !== undefined && item.oldValue !== null
                                ? JSON.stringify(item.oldValue, null, 2)
                                : '-'}
                            </pre>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold">New value</h3>
                              {item.newValue !== undefined && item.newValue !== null && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyText(JSON.stringify(item.newValue, null, 2), 'New value copiato')}
                                >
                                  <Copy className="w-4 h-4 mr-1" />
                                  Copia
                                </Button>
                              )}
                            </div>
                            <pre className="rounded-md border border-border bg-white p-3 text-xs overflow-auto max-h-72">
                              {item.newValue !== undefined && item.newValue !== null
                                ? JSON.stringify(item.newValue, null, 2)
                                : '-'}
                            </pre>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground-muted">
                          <span>IP: {item.ipAddress || '-'}</span>
                          <span>UserAgent: {item.userAgent || '-'}</span>
                          {item.entityId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyText(item.entityId, 'Entity ID copiato')}
                            >
                              Copia Entity ID
                            </Button>
                          )}
                          {item.userId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyText(item.userId || '', 'User ID copiato')}
                            >
                              Copia User ID
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={data?.meta.page || 1}
        totalPages={data?.meta.totalPages || 1}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
