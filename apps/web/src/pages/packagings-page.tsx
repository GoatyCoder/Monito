import { useCallback, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  useCreatePackaging,
  useDeletePackaging,
  usePackagings,
  usePurgePackaging,
  useRestorePackaging,
  useUpdatePackaging,
  type PackagingFilters,
} from '@/hooks/use-packagings';
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
import type { Packaging } from '@monito/types';

const packagingSchema = z.object({
  code: z.string().min(1, 'Codice richiesto'),
  name: z.string().min(1, 'Nome richiesto'),
  description: z.string().optional(),
});

type PackagingForm = z.infer<typeof packagingSchema>;

export function PackagingsPage() {
  const formId = useId();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [filters, setFilters] = useState<PackagingFilters>({
    page: 1,
    limit: 20,
    search: '',
    sort: '',
    view: 'active',
  });

  const { data, isLoading } = usePackagings(filters);
  const createPackaging = useCreatePackaging();
  const updatePackaging = useUpdatePackaging();
  const deletePackaging = useDeletePackaging();
  const restorePackaging = useRestorePackaging();
  const purgePackaging = usePurgePackaging();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackaging, setEditingPackaging] = useState<Packaging | null>(null);
  const [deletingPackaging, setDeletingPackaging] = useState<Packaging | null>(null);
  const [purgingPackaging, setPurgingPackaging] = useState<Packaging | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PackagingForm>({
    resolver: zodResolver(packagingSchema),
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

  const handleOpenDialog = (packaging?: Packaging) => {
    if (packaging) {
      setEditingPackaging(packaging);
      reset({ code: packaging.code, name: packaging.name, description: packaging.description || '' });
    } else {
      setEditingPackaging(null);
      reset({ code: '', name: '', description: '' });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPackaging(null);
    reset({ code: '', name: '', description: '' });
  };

  const onSubmit = async (formData: PackagingForm) => {
    try {
      if (editingPackaging) {
        await updatePackaging.mutateAsync({ id: editingPackaging.id, data: formData });
        showSuccess('Imballaggio aggiornato con successo');
      } else {
        await createPackaging.mutateAsync(formData);
        showSuccess('Imballaggio creato con successo');
      }
      handleCloseDialog();
    } catch {
      showError('Errore durante il salvataggio');
    }
  };

  const handleDelete = async () => {
    if (!deletingPackaging) return;
    try {
      await deletePackaging.mutateAsync(deletingPackaging.id);
      showSuccess('Imballaggio eliminato con successo');
      setDeletingPackaging(null);
    } catch {
      showError('Errore durante l\'eliminazione');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restorePackaging.mutateAsync(id);
      showSuccess('Imballaggio ripristinato con successo');
    } catch {
      showError('Errore durante il ripristino');
    }
  };

  const handlePurge = async (reason: string) => {
    if (!purgingPackaging) return;

    try {
      await purgePackaging.mutateAsync({ id: purgingPackaging.id, reason });
      showSuccess('Imballaggio eliminato definitivamente');
      setPurgingPackaging(null);
    } catch {
      showError('Errore durante l\'eliminazione definitiva');
    }
  };

  return (
    <div className="space-y-4" id="main-content" role="main" aria-label="Gestione imballaggi">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Imballaggi</h1>
        {isAdmin && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nuovo Imballaggio
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <SearchInput
          value={filters.search || ''}
          onChange={handleSearchChange}
          placeholder="Cerca imballaggi..."
        />
        {isAdmin && <ViewToggle view={filters.view ?? 'active'} onChange={handleViewChange} />}
      </div>

      <div className="border rounded-md" role="region" aria-label="Tabella imballaggi">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">
                <button
                  onClick={() => handleSortChange('code')}
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                >
                  Codice
                </button>
              </TableHead>
              <TableHead scope="col">Nome</TableHead>
              <TableHead scope="col">Descrizione</TableHead>
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
                  Nessun imballaggio trovato
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((packaging) => (
                <TableRow
                  key={packaging.id}
                  className={packaging.deletedAt ? 'bg-red-50 dark:bg-red-900/20' : ''}
                >
                  <TableCell className="font-medium">{packaging.code}</TableCell>
                  <TableCell>{packaging.name}</TableCell>
                  <TableCell className="text-foreground-muted">{packaging.description || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {packaging.deletedAt && isAdmin ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRestore(packaging.id)}
                          aria-label={`Ripristina imballaggio ${packaging.name}`}
                          disabled={restorePackaging.isPending}
                        >
                          <RotateCcw className="h-4 w-4 text-green-600" aria-hidden="true" />
                        </Button>
                      ) : isAdmin ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(packaging)}
                            aria-label={`Modifica imballaggio ${packaging.name}`}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingPackaging(packaging)}
                            aria-label={`Elimina imballaggio ${packaging.name}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-foreground-muted">-</span>
                      )}
                      {packaging.deletedAt && isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPurgingPackaging(packaging)}
                          aria-label={`Elimina definitivamente imballaggio ${packaging.name}`}
                          disabled={purgePackaging.isPending}
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
              {editingPackaging ? 'Modifica Imballaggio' : 'Nuovo Imballaggio'}
            </DialogTitle>
            <DialogDescription id={`${formId}-description`}>
              {editingPackaging
                ? 'Modifica i dettagli dell\'imballaggio'
                : 'Inserisci i dettagli del nuovo imballaggio'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} id={formId}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="packaging-code">Codice</Label>
                <Input
                  id="packaging-code"
                  aria-describedby={errors.code ? 'packaging-code-error' : undefined}
                  {...register('code')}
                />
                {errors.code && (
                  <p id="packaging-code-error" className="text-sm text-red-600" role="alert">
                    {errors.code.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="packaging-name">Nome</Label>
                <Input
                  id="packaging-name"
                  aria-describedby={errors.name ? 'packaging-name-error' : undefined}
                  {...register('name')}
                />
                {errors.name && (
                  <p id="packaging-name-error" className="text-sm text-red-600" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="packaging-description">Descrizione</Label>
                <Input id="packaging-description" {...register('description')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={createPackaging.isPending || updatePackaging.isPending}
                aria-busy={createPackaging.isPending || updatePackaging.isPending}
              >
                {createPackaging.isPending || updatePackaging.isPending ? 'Salvataggio...' : 'Salva'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingPackaging} onOpenChange={() => setDeletingPackaging(null)}>
        <DialogContent aria-describedby="delete-packaging-description">
          <DialogHeader>
            <DialogTitle>Elimina Imballaggio</DialogTitle>
            <DialogDescription id="delete-packaging-description">
              Sei sicuro di voler eliminare l\'imballaggio &quot;{deletingPackaging?.name}&quot;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingPackaging(null)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletePackaging.isPending}
              aria-busy={deletePackaging.isPending}
            >
              {deletePackaging.isPending ? 'Eliminazione...' : 'Elimina'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PurgeDialog
        open={!!purgingPackaging}
        onOpenChange={(open) => {
          if (!open) setPurgingPackaging(null);
        }}
        entityLabel="Imballaggio"
        itemName={purgingPackaging?.name || ''}
        pending={purgePackaging.isPending}
        onConfirm={handlePurge}
      />
    </div>
  );
}
