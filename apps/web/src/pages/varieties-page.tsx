import { useCallback, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  useCreateVariety,
  useDeleteVariety,
  usePurgeVariety,
  useRestoreVariety,
  useUpdateVariety,
  useVarieties,
  type VarietyFilters,
} from '@/hooks/use-varieties';
import { useProducts } from '@/hooks/use-products';
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
import type { Variety } from '@monito/types';

const varietySchema = z.object({
  code: z.string().min(1, 'Codice richiesto'),
  name: z.string().min(1, 'Nome richiesto'),
  description: z.string().optional(),
  productId: z.string().min(1, 'Prodotto richiesto'),
});

type VarietyForm = z.infer<typeof varietySchema>;

export function VarietiesPage() {
  const formId = useId();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [filters, setFilters] = useState<VarietyFilters>({
    page: 1,
    limit: 20,
    search: '',
    sort: '',
    view: 'active',
  });

  const { data, isLoading } = useVarieties(filters);
  const { data: productsData } = useProducts({ page: 1, limit: 200, view: 'active' });

  const createVariety = useCreateVariety();
  const updateVariety = useUpdateVariety();
  const deleteVariety = useDeleteVariety();
  const restoreVariety = useRestoreVariety();
  const purgeVariety = usePurgeVariety();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVariety, setEditingVariety] = useState<Variety | null>(null);
  const [deletingVariety, setDeletingVariety] = useState<Variety | null>(null);
  const [purgingVariety, setPurgingVariety] = useState<Variety | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VarietyForm>({
    resolver: zodResolver(varietySchema),
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

  const handleOpenDialog = (variety?: Variety) => {
    if (variety) {
      setEditingVariety(variety);
      reset({
        code: variety.code,
        name: variety.name,
        description: variety.description || '',
        productId: variety.productId,
      });
    } else {
      setEditingVariety(null);
      reset({ code: '', name: '', description: '', productId: '' });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingVariety(null);
    reset({ code: '', name: '', description: '', productId: '' });
  };

  const onSubmit = async (formData: VarietyForm) => {
    try {
      if (editingVariety) {
        await updateVariety.mutateAsync({ id: editingVariety.id, data: formData });
        showSuccess('Varietà aggiornata con successo');
      } else {
        await createVariety.mutateAsync(formData);
        showSuccess('Varietà creata con successo');
      }
      handleCloseDialog();
    } catch {
      showError('Errore durante il salvataggio');
    }
  };

  const handleDelete = async () => {
    if (!deletingVariety) return;
    try {
      await deleteVariety.mutateAsync(deletingVariety.id);
      showSuccess('Varietà eliminata con successo');
      setDeletingVariety(null);
    } catch {
      showError('Errore durante l\'eliminazione');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreVariety.mutateAsync(id);
      showSuccess('Varietà ripristinata con successo');
    } catch {
      showError('Errore durante il ripristino');
    }
  };

  const handlePurge = async (reason: string) => {
    if (!purgingVariety) return;

    try {
      await purgeVariety.mutateAsync({ id: purgingVariety.id, reason });
      showSuccess('Varietà eliminata definitivamente');
      setPurgingVariety(null);
    } catch {
      showError('Errore durante l\'eliminazione definitiva');
    }
  };

  const products = productsData?.data ?? [];
  const productById = new Map(products.map((p) => [p.id, p.name]));

  return (
    <div className="space-y-4" id="main-content" role="main" aria-label="Gestione varietà">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Varietà</h1>
        {isAdmin && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nuova Varietà
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <SearchInput
          value={filters.search || ''}
          onChange={handleSearchChange}
          placeholder="Cerca varietà..."
        />
        {isAdmin && (
          <ViewToggle
            view={filters.view ?? 'active'}
            onChange={handleViewChange}
            activeLabel="Attive"
          />
        )}
      </div>

      <div className="border rounded-md" role="region" aria-label="Tabella varietà">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">
                <button
                  onClick={() => handleSortChange('code')}
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                  aria-sort={(filters.sort || '').startsWith('code')
                    ? (filters.sort || '').endsWith('desc')
                      ? 'descending'
                      : 'ascending'
                    : 'none'}
                >
                  Codice
                </button>
              </TableHead>
              <TableHead scope="col">Nome</TableHead>
              <TableHead scope="col">Prodotto</TableHead>
              <TableHead scope="col">Descrizione</TableHead>
              <TableHead scope="col" className="w-[120px]">
                Azioni
              </TableHead>
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
                  Nessuna varietà trovata
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((variety) => (
                <TableRow
                  key={variety.id}
                  className={variety.deletedAt ? 'bg-red-50 dark:bg-red-900/20' : ''}
                >
                  <TableCell className="font-medium">{variety.code}</TableCell>
                  <TableCell>{variety.name}</TableCell>
                  <TableCell>{productById.get(variety.productId) ?? variety.productId}</TableCell>
                  <TableCell className="text-foreground-muted">{variety.description || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {variety.deletedAt && isAdmin ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRestore(variety.id)}
                          aria-label={`Ripristina varietà ${variety.name}`}
                          disabled={restoreVariety.isPending}
                        >
                          <RotateCcw className="h-4 w-4 text-green-600" aria-hidden="true" />
                        </Button>
                      ) : isAdmin ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(variety)}
                            aria-label={`Modifica varietà ${variety.name}`}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingVariety(variety)}
                            aria-label={`Elimina varietà ${variety.name}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-foreground-muted">-</span>
                      )}
                      {variety.deletedAt && isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPurgingVariety(variety)}
                          aria-label={`Elimina definitivamente varietà ${variety.name}`}
                          disabled={purgeVariety.isPending}
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
              {editingVariety ? 'Modifica Varietà' : 'Nuova Varietà'}
            </DialogTitle>
            <DialogDescription id={`${formId}-description`}>
              {editingVariety
                ? 'Modifica i dettagli della varietà'
                : 'Inserisci i dettagli della nuova varietà'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} id={formId}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="variety-code">Codice</Label>
                <Input
                  id="variety-code"
                  aria-describedby={errors.code ? 'variety-code-error' : undefined}
                  {...register('code')}
                />
                {errors.code && (
                  <p id="variety-code-error" className="text-sm text-red-600" role="alert">
                    {errors.code.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="variety-name">Nome</Label>
                <Input
                  id="variety-name"
                  aria-describedby={errors.name ? 'variety-name-error' : undefined}
                  {...register('name')}
                />
                {errors.name && (
                  <p id="variety-name-error" className="text-sm text-red-600" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="variety-product">Prodotto</Label>
                <select
                  id="variety-product"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register('productId')}
                >
                  <option value="">Seleziona prodotto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                {errors.productId && (
                  <p className="text-sm text-red-600" role="alert">
                    {errors.productId.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="variety-description">Descrizione</Label>
                <Input id="variety-description" {...register('description')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={createVariety.isPending || updateVariety.isPending}
                aria-busy={createVariety.isPending || updateVariety.isPending}
              >
                {createVariety.isPending || updateVariety.isPending ? 'Salvataggio...' : 'Salva'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingVariety} onOpenChange={() => setDeletingVariety(null)}>
        <DialogContent aria-describedby="delete-variety-description">
          <DialogHeader>
            <DialogTitle>Elimina Varietà</DialogTitle>
            <DialogDescription id="delete-variety-description">
              Sei sicuro di voler eliminare la varietà &quot;{deletingVariety?.name}&quot;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingVariety(null)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteVariety.isPending}
              aria-busy={deleteVariety.isPending}
            >
              {deleteVariety.isPending ? 'Eliminazione...' : 'Elimina'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PurgeDialog
        open={!!purgingVariety}
        onOpenChange={(open) => {
          if (!open) setPurgingVariety(null);
        }}
        entityLabel="Varietà"
        itemName={purgingVariety?.name || ''}
        pending={purgeVariety.isPending}
        onConfirm={handlePurge}
      />
    </div>
  );
}
