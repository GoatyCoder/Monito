import { useCallback, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  useCreateFieldLot,
  useDeleteFieldLot,
  useFieldLots,
  usePurgeFieldLot,
  useRestoreFieldLot,
  useUpdateFieldLot,
  type FieldLotFilters,
} from '@/hooks/use-field-lots';
import { useAllVarieties } from '@/hooks/use-varieties';
import { useAuth } from '@/contexts/auth-context';
import { showError, showSuccess } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination, SearchInput } from '@/components/ui/data-table';
import { ViewToggle } from '@/components/ui/view-toggle';
import { PurgeDialog } from '@/components/ui/purge-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { FieldLot } from '@monito/types';

const fieldLotSchema = z.object({
  lotCode: z.string().min(1, 'Codice lotto richiesto').max(16, 'Massimo 16 caratteri'),
  supplier: z.string().min(1, 'Fornitore richiesto'),
  varietyId: z.string().min(1, 'Varietà richiesta'),
});

type FieldLotForm = z.infer<typeof fieldLotSchema>;

export function FieldLotsPage() {
  const formId = useId();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [filters, setFilters] = useState<FieldLotFilters>({
    page: 1,
    limit: 20,
    search: '',
    sort: '',
    view: 'active',
  });

  const { data, isLoading } = useFieldLots(filters);
  const { data: varietiesData } = useAllVarieties();

  const createFieldLot = useCreateFieldLot();
  const updateFieldLot = useUpdateFieldLot();
  const deleteFieldLot = useDeleteFieldLot();
  const restoreFieldLot = useRestoreFieldLot();
  const purgeFieldLot = usePurgeFieldLot();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFieldLot, setEditingFieldLot] = useState<FieldLot | null>(null);
  const [deletingFieldLot, setDeletingFieldLot] = useState<FieldLot | null>(null);
  const [purgingFieldLot, setPurgingFieldLot] = useState<FieldLot | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FieldLotForm>({
    resolver: zodResolver(fieldLotSchema),
  });

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleSearchChange = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const handleSortChange = useCallback((column: string) => {
    setFilters((prev) => {
      const currentSort = prev.sort || '';
      const isActive = currentSort.startsWith(column);
      const direction = isActive && currentSort.endsWith('desc') ? 'asc' : 'desc';
      return { ...prev, sort: `${column}_${direction}`, page: 1 };
    });
  }, []);

  const handleViewChange = useCallback((view: 'active' | 'deleted') => {
    setFilters((prev) => ({ ...prev, view, page: 1 }));
  }, []);

  const handleOpenDialog = (fieldLot?: FieldLot) => {
    if (fieldLot) {
      setEditingFieldLot(fieldLot);
      reset({
        lotCode: fieldLot.lotCode,
        supplier: fieldLot.supplier,
        varietyId: fieldLot.varietyId,
      });
    } else {
      setEditingFieldLot(null);
      reset({ lotCode: '', supplier: '', varietyId: '' });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingFieldLot(null);
    reset({ lotCode: '', supplier: '', varietyId: '' });
  };

  const onSubmit = async (formData: FieldLotForm) => {
    try {
      if (editingFieldLot) {
        await updateFieldLot.mutateAsync({ id: editingFieldLot.id, data: formData });
        showSuccess('Lotto aggiornato con successo');
      } else {
        await createFieldLot.mutateAsync(formData);
        showSuccess('Lotto creato con successo');
      }
      handleCloseDialog();
    } catch {
      showError('Errore durante il salvataggio');
    }
  };

  const handleDelete = async () => {
    if (!deletingFieldLot) return;
    try {
      await deleteFieldLot.mutateAsync(deletingFieldLot.id);
      showSuccess('Lotto eliminato con successo');
      setDeletingFieldLot(null);
    } catch {
      showError('Errore durante l\'eliminazione');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreFieldLot.mutateAsync(id);
      showSuccess('Lotto ripristinato con successo');
    } catch {
      showError('Errore durante il ripristino');
    }
  };

  const handlePurge = async (reason: string) => {
    if (!purgingFieldLot) return;

    try {
      await purgeFieldLot.mutateAsync({ id: purgingFieldLot.id, reason });
      showSuccess('Lotto eliminato definitivamente');
      setPurgingFieldLot(null);
    } catch {
      showError('Errore durante l\'eliminazione definitiva');
    }
  };

  const varieties = varietiesData ?? [];
  const varietyById = new Map(varieties.map((v) => [v.id, v.name]));

  return (
    <div className="space-y-4" id="main-content" role="main" aria-label="Gestione lotti di campo">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Lotti di Campo</h1>
        {isAdmin && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nuovo Lotto
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <SearchInput value={filters.search || ''} onChange={handleSearchChange} placeholder="Cerca lotti..." />
        {isAdmin && <ViewToggle view={filters.view ?? 'active'} onChange={handleViewChange} />}
      </div>

      <div className="border rounded-md" role="region" aria-label="Tabella lotti di campo">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">
                <button onClick={() => handleSortChange('lotCode')} className="font-medium hover:text-foreground">
                  Codice Lotto
                </button>
              </TableHead>
              <TableHead scope="col">Fornitore</TableHead>
              <TableHead scope="col">Varietà</TableHead>
              <TableHead scope="col" className="w-[120px]">
                Azioni
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8" aria-busy="true" aria-live="polite">
                  Caricamento...
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-foreground-muted">
                  Nessun lotto trovato
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((item) => (
                <TableRow key={item.id} className={item.deletedAt ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                  <TableCell className="font-medium">{item.lotCode}</TableCell>
                  <TableCell>{item.supplier}</TableCell>
                  <TableCell>{varietyById.get(item.varietyId) ?? item.varietyId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.deletedAt && isAdmin ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRestore(item.id)}
                          aria-label={`Ripristina lotto ${item.lotCode}`}
                          disabled={restoreFieldLot.isPending}
                        >
                          <RotateCcw className="h-4 w-4 text-green-600" aria-hidden="true" />
                        </Button>
                      ) : isAdmin ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(item)}
                            aria-label={`Modifica lotto ${item.lotCode}`}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingFieldLot(item)}
                            aria-label={`Elimina lotto ${item.lotCode}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-foreground-muted">-</span>
                      )}
                      {item.deletedAt && isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPurgingFieldLot(item)}
                          aria-label={`Elimina definitivamente lotto ${item.lotCode}`}
                          disabled={purgeFieldLot.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent aria-describedby={`${formId}-description`}>
          <DialogHeader>
            <DialogTitle id={`${formId}-title`}>
              {editingFieldLot ? 'Modifica Lotto' : 'Nuovo Lotto'}
            </DialogTitle>
            <DialogDescription id={`${formId}-description`}>
              {editingFieldLot
                ? 'Modifica i dettagli del lotto'
                : 'Inserisci i dettagli del nuovo lotto'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} id={formId}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="field-lot-code">Codice Lotto</Label>
                <Input id="field-lot-code" {...register('lotCode')} />
                {errors.lotCode && (
                  <p className="text-sm text-red-600" role="alert">
                    {errors.lotCode.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="field-lot-supplier">Fornitore</Label>
                <Input id="field-lot-supplier" {...register('supplier')} />
                {errors.supplier && (
                  <p className="text-sm text-red-600" role="alert">
                    {errors.supplier.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="field-lot-variety">Varietà</Label>
                <select
                  id="field-lot-variety"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register('varietyId')}
                >
                  <option value="">Seleziona varietà</option>
                  {varieties.map((variety) => (
                    <option key={variety.id} value={variety.id}>
                      {variety.name}
                    </option>
                  ))}
                </select>
                {errors.varietyId && (
                  <p className="text-sm text-red-600" role="alert">
                    {errors.varietyId.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annulla
              </Button>
              <Button type="submit" disabled={createFieldLot.isPending || updateFieldLot.isPending}>
                {createFieldLot.isPending || updateFieldLot.isPending ? 'Salvataggio...' : 'Salva'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingFieldLot} onOpenChange={() => setDeletingFieldLot(null)}>
        <DialogContent aria-describedby="delete-field-lot-description">
          <DialogHeader>
            <DialogTitle>Elimina Lotto</DialogTitle>
            <DialogDescription id="delete-field-lot-description">
              Sei sicuro di voler eliminare il lotto &quot;{deletingFieldLot?.lotCode}&quot;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingFieldLot(null)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteFieldLot.isPending}>
              {deleteFieldLot.isPending ? 'Eliminazione...' : 'Elimina'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PurgeDialog
        open={!!purgingFieldLot}
        onOpenChange={(open) => {
          if (!open) setPurgingFieldLot(null);
        }}
        entityLabel="Lotto"
        itemName={purgingFieldLot?.lotCode || ''}
        pending={purgeFieldLot.isPending}
        onConfirm={handlePurge}
      />
    </div>
  );
}
