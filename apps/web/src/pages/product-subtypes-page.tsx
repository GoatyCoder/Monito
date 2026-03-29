import { useCallback, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  useCreateProductSubtype,
  useDeleteProductSubtype,
  usePurgeProductSubtype,
  useRestoreProductSubtype,
  useUpdateProductSubtype,
  useProductSubtypes,
  type ProductSubtypeFilters,
} from '@/hooks/use-product-subtypes';
import { useAllProducts } from '@/hooks/use-products';
import { useAuth } from '@/contexts/auth-context';
import { showError, showSuccess } from '@/lib/toast';
import { getApiErrorMessage } from '@/lib/error-utils';
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
import type { ProductSubtype } from '@monito/types';

const productSubtypeSchema = z.object({
  code: z.string().min(1, 'Codice richiesto').max(14, 'Massimo 14 caratteri'),
  name: z.string().min(1, 'Nome richiesto'),
  description: z.string().optional(),
  productId: z.string().min(1, 'Prodotto richiesto'),
});

type ProductSubtypeForm = z.infer<typeof productSubtypeSchema>;

export function ProductSubtypesPage() {
  const formId = useId();
  const { user, preferences } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [filters, setFilters] = useState<ProductSubtypeFilters>({
    page: 1,
    limit: preferences.masterDataPageSize,
    search: '',
    sort: '',
    view: 'active',
  });

  const { data, isLoading } = useProductSubtypes(filters);
  const { data: productsData } = useAllProducts();

  const createProductSubtype = useCreateProductSubtype();
  const updateProductSubtype = useUpdateProductSubtype();
  const deleteProductSubtype = useDeleteProductSubtype();
  const restoreProductSubtype = useRestoreProductSubtype();
  const purgeProductSubtype = usePurgeProductSubtype();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProductSubtype, setEditingProductSubtype] = useState<ProductSubtype | null>(null);
  const [deletingProductSubtype, setDeletingProductSubtype] = useState<ProductSubtype | null>(null);
  const [purgingProductSubtype, setPurgingProductSubtype] = useState<ProductSubtype | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductSubtypeForm>({
    resolver: zodResolver(productSubtypeSchema),
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

  const handleOpenDialog = (productSubtype?: ProductSubtype) => {
    if (productSubtype) {
      setEditingProductSubtype(productSubtype);
      reset({
        code: productSubtype.code,
        name: productSubtype.name,
        description: productSubtype.description || '',
        productId: productSubtype.productId,
      });
    } else {
      setEditingProductSubtype(null);
      reset({ code: '', name: '', description: '', productId: '' });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProductSubtype(null);
    reset({ code: '', name: '', description: '', productId: '' });
  };

  const onSubmit = async (formData: ProductSubtypeForm) => {
    try {
      if (editingProductSubtype) {
        await updateProductSubtype.mutateAsync({ id: editingProductSubtype.id, data: formData });
        showSuccess('Sottotipologia aggiornata con successo');
      } else {
        await createProductSubtype.mutateAsync(formData);
        showSuccess('Sottotipologia creata con successo');
      }
      handleCloseDialog();
    } catch (err) {
      showError(getApiErrorMessage(err, 'Errore durante il salvataggio'));
    }
  };

  const handleDelete = async () => {
    if (!deletingProductSubtype) return;
    try {
      await deleteProductSubtype.mutateAsync(deletingProductSubtype.id);
      showSuccess('Sottotipologia eliminata con successo');
      setDeletingProductSubtype(null);
    } catch (err) {
      showError(getApiErrorMessage(err, 'Errore durante l\'eliminazione'));
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreProductSubtype.mutateAsync(id);
      showSuccess('Sottotipologia ripristinata con successo');
    } catch (err) {
      showError(getApiErrorMessage(err, 'Errore durante il ripristino'));
    }
  };

  const handlePurge = async (reason: string) => {
    if (!purgingProductSubtype) return;

    try {
      await purgeProductSubtype.mutateAsync({
        id: purgingProductSubtype.id,
        reason,
      });
      showSuccess('Sottotipologia eliminata definitivamente');
      setPurgingProductSubtype(null);
    } catch (err) {
      showError(getApiErrorMessage(err, 'Errore durante l\'eliminazione definitiva'));
    }
  };

  const products = productsData ?? [];
  const productById = new Map(products.map((p) => [p.id, p.name]));

  return (
    <div className="space-y-4" id="main-content" role="main" aria-label="Gestione sottotipologie">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Sottotipologie</h1>
        {isAdmin && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nuova Sottotipologia
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <SearchInput
          value={filters.search || ''}
          onChange={handleSearchChange}
          placeholder="Cerca sottotipologie..."
        />
        {isAdmin && (
          <ViewToggle
            view={filters.view ?? 'active'}
            onChange={handleViewChange}
            activeLabel="Attive"
          />
        )}
      </div>

      <div className="border rounded-md" role="region" aria-label="Tabella sottotipologie">
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
                  Nessuna sottotipologia trovata
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((item) => (
                <TableRow
                  key={item.id}
                  className={item.deletedAt ? 'bg-red-50 dark:bg-red-900/20' : ''}
                >
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{productById.get(item.productId) ?? item.productId}</TableCell>
                  <TableCell className="text-foreground-muted">{item.description || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.deletedAt && isAdmin ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRestore(item.id)}
                          aria-label={`Ripristina sottotipologia ${item.name}`}
                          disabled={restoreProductSubtype.isPending}
                        >
                          <RotateCcw className="h-4 w-4 text-green-600" aria-hidden="true" />
                        </Button>
                      ) : isAdmin ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(item)}
                            aria-label={`Modifica sottotipologia ${item.name}`}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingProductSubtype(item)}
                            aria-label={`Elimina sottotipologia ${item.name}`}
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
                          onClick={() => setPurgingProductSubtype(item)}
                          aria-label={`Elimina definitivamente sottotipologia ${item.name}`}
                          disabled={purgeProductSubtype.isPending}
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
              {editingProductSubtype ? 'Modifica Sottotipologia' : 'Nuova Sottotipologia'}
            </DialogTitle>
            <DialogDescription id={`${formId}-description`}>
              {editingProductSubtype
                ? 'Modifica i dettagli della sottotipologia'
                : 'Inserisci i dettagli della nuova sottotipologia'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} id={formId}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subtype-code">Codice</Label>
                <Input
                  id="subtype-code"
                  maxLength={14}
                  aria-describedby={errors.code ? 'subtype-code-error' : undefined}
                  {...register('code')}
                />
                {errors.code && (
                  <p id="subtype-code-error" className="text-sm text-red-600" role="alert">
                    {errors.code.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtype-name">Nome</Label>
                <Input
                  id="subtype-name"
                  aria-describedby={errors.name ? 'subtype-name-error' : undefined}
                  {...register('name')}
                />
                {errors.name && (
                  <p id="subtype-name-error" className="text-sm text-red-600" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtype-product">Prodotto</Label>
                <select
                  id="subtype-product"
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
                <Label htmlFor="subtype-description">Descrizione</Label>
                <Input id="subtype-description" {...register('description')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={createProductSubtype.isPending || updateProductSubtype.isPending}
                aria-busy={createProductSubtype.isPending || updateProductSubtype.isPending}
              >
                {createProductSubtype.isPending || updateProductSubtype.isPending ? 'Salvataggio...' : 'Salva'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingProductSubtype} onOpenChange={() => setDeletingProductSubtype(null)}>
        <DialogContent aria-describedby="delete-subtype-description">
          <DialogHeader>
            <DialogTitle>Elimina Sottotipologia</DialogTitle>
            <DialogDescription id="delete-subtype-description">
              Sei sicuro di voler eliminare la sottotipologia &quot;{deletingProductSubtype?.name}&quot;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingProductSubtype(null)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteProductSubtype.isPending}
              aria-busy={deleteProductSubtype.isPending}
            >
              {deleteProductSubtype.isPending ? 'Eliminazione...' : 'Elimina'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PurgeDialog
        open={!!purgingProductSubtype}
        onOpenChange={(open) => {
          if (!open) setPurgingProductSubtype(null);
        }}
        entityLabel="Sottotipologia"
        itemName={purgingProductSubtype?.name || ''}
        pending={purgeProductSubtype.isPending}
        onConfirm={handlePurge}
      />
    </div>
  );
}
