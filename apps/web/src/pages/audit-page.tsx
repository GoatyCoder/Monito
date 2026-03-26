import { useCallback, useState } from 'react';
import { useAuditLogs, type AuditFilters, type AuditOperation } from '@/hooks/use-audit';
import { Pagination } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/auth-context';

const operations: AuditOperation[] = [
  'CREATE',
  'UPDATE',
  'SOFT_DELETE',
  'RESTORE',
  'HARD_DELETE',
  'LOGIN',
  'LOGOUT',
];

export function AuditPage() {
  const { preferences } = useAuth();
  const [filters, setFilters] = useState<AuditFilters>({
    page: 1,
    limit: preferences.auditLogPageSize,
    entity: '',
    entityId: '',
    userId: '',
    operation: undefined,
    startDate: '',
    endDate: '',
  });

  const { data, isLoading } = useAuditLogs(filters);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const updateFilter = useCallback(
    (key: keyof AuditFilters, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value || undefined, page: 1 }));
    },
    [],
  );

  return (
    <div className="space-y-4" id="main-content" role="main" aria-label="Audit log">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 border rounded-md p-4">
        <div className="space-y-2">
          <Label htmlFor="audit-entity">Entity</Label>
          <Input
            id="audit-entity"
            value={filters.entity || ''}
            onChange={(e) => updateFilter('entity', e.target.value)}
            placeholder="Es. Product"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="audit-entity-id">Entity ID</Label>
          <Input
            id="audit-entity-id"
            value={filters.entityId || ''}
            onChange={(e) => updateFilter('entityId', e.target.value)}
            placeholder="ID risorsa"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="audit-user-id">User ID</Label>
          <Input
            id="audit-user-id"
            value={filters.userId || ''}
            onChange={(e) => updateFilter('userId', e.target.value)}
            placeholder="ID utente"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="audit-operation">Operazione</Label>
          <select
            id="audit-operation"
            value={filters.operation || ''}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                operation: (e.target.value || undefined) as AuditOperation | undefined,
                page: 1,
              }))
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Tutte</option>
            {operations.map((operation) => (
              <option key={operation} value={operation}>
                {operation}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="audit-start-date">Data inizio</Label>
          <Input
            id="audit-start-date"
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => updateFilter('startDate', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="audit-end-date">Data fine</Label>
          <Input
            id="audit-end-date"
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => updateFilter('endDate', e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md" role="region" aria-label="Tabella audit log">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Timestamp</TableHead>
              <TableHead scope="col">Operazione</TableHead>
              <TableHead scope="col">Entity</TableHead>
              <TableHead scope="col">Entity ID</TableHead>
              <TableHead scope="col">User ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8" aria-busy="true" aria-live="polite">
                  Caricamento...
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-foreground-muted">
                  Nessun evento audit trovato
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{new Date(item.timestamp).toLocaleString('it-IT')}</TableCell>
                  <TableCell>{item.operation}</TableCell>
                  <TableCell>{item.entity}</TableCell>
                  <TableCell>{item.entityId}</TableCell>
                  <TableCell>{item.userId || '-'}</TableCell>
                </TableRow>
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
