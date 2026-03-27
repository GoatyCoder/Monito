import { useCallback, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, RotateCcw, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import {
  useCreateProcessedProduct,
  useDeleteProcessedProduct,
  useProcessedProducts,
  usePurgeProcessedProduct,
  useRestoreProcessedProduct,
  useUpdateProcessedProduct,
  type ProcessedProductFilters,
} from '@/hooks/use-processed-products';
import { useAllProducts } from '@/hooks/use-products';
import { useAllProductSubtypes } from '@/hooks/use-product-subtypes';
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
import type { ProcessedProduct } from '@monito/types';

const processedProductSchema = z.object({
  code: z.string().min(1, 'Codice richiesto').max(14, 'Massimo 14 caratteri'),
  name: z.string().min(1, 'Nome richiesto'),
  description: z.string().optional(),
  ean: z
    .string()
    .regex(/^[0-9]{13}$/, 'EAN deve essere composto da 13 cifre')
    .optional()
    .or(z.literal('')),
  weightPerBoxKg: z.coerce.number().positive('Peso richiesto e deve essere > 0'),
  allowedProductIds: z.array(z.string()).optional(),
  allowedSubtypeIds: z.array(z.string()).optional(),
  allowedVarietyIds: z.array(z.string()).optional(),
});

type ProcessedProductForm = z.infer<typeof processedProductSchema>;

export function ProcessedProductsPage() {
  const formId = useId();
  const { user, preferences } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [filters, setFilters] = useState<ProcessedProductFilters>({
    page: 1,
    limit: preferences.masterDataPageSize,
    search: '',
    sort: '',
    view: 'active',
  });

  const { data, isLoading } = useProcessedProducts(filters);
  const { data: productsData } = useAllProducts();
  const { data: subtypesData } = useAllProductSubtypes();
  const { data: varietiesData } = useAllVarieties();

  const createProcessedProduct = useCreateProcessedProduct();
  const updateProcessedProduct = useUpdateProcessedProduct();
  const deleteProcessedProduct = useDeleteProcessedProduct();
  const restoreProcessedProduct = useRestoreProcessedProduct();
  const purgeProcessedProduct = usePurgeProcessedProduct();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProcessedProduct, setEditingProcessedProduct] = useState<ProcessedProduct | null>(null);
  const [deletingProcessedProduct, setDeletingProcessedProduct] = useState<ProcessedProduct | null>(null);
  const [purgingProcessedProduct, setPurgingProcessedProduct] = useState<ProcessedProduct | null>(null);
  const [showConstraints, setShowConstraints] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProcessedProductForm>({
    resolver: zodResolver(processedProductSchema),
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

  const handleOpenDialog = (processedProduct?: ProcessedProduct) => {
    if (processedProduct) {
      setEditingProcessedProduct(processedProduct);
      reset({
        code: processedProduct.code,
        name: processedProduct.name,
        description: processedProduct.description || '',
        ean: processedProduct.ean || '',
        weightPerBoxKg: processedProduct.weightPerBoxKg,
        allowedProductIds: processedProduct.allowedProductIds || [],
        allowedSubtypeIds: processedProduct.allowedSubtypeIds || [],
        allowedVarietyIds: processedProduct.allowedVarietyIds || [],
      });
    } else {
      setEditingProcessedProduct(null);
      reset({
        code: '',
        name: '',
        description: '',
        ean: '',
        weightPerBoxKg: 0.5,
        allowedProductIds: [],
        allowedSubtypeIds: [],
        allowedVarietyIds: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProcessedProduct(null);
    reset({
      code: '',
      name: '',
      description: '',
      ean: '',
      weightPerBoxKg: 0.5,
      allowedProductIds: [],
      allowedSubtypeIds: [],
      allowedVarietyIds: [],
    });
  };

  const onSubmit = async (formData: ProcessedProductForm) => {
    const payload = {
      ...formData,
      ean: formData.ean || undefined,
    };

    try {
      if (editingProcessedProduct) {
        await updateProcessedProduct.mutateAsync({ id: editingProcessedProduct.id, data: payload });
        showSuccess('Lavorato aggiornato con successo');
      } else {
        await createProcessedProduct.mutateAsync(payload);
        showSuccess('Lavorato creato con successo');
      }
      handleCloseDialog();
    } catch {
      showError('Errore durante il salvataggio');
    }
  };

  const handleDelete = async () => {
    if (!deletingProcessedProduct) return;
    try {
      await deleteProcessedProduct.mutateAsync(deletingProcessedProduct.id);
      showSuccess('Lavorato eliminato con successo');
      setDeletingProcessedProduct(null);
    } catch {
      showError('Errore durante l\'eliminazione');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreProcessedProduct.mutateAsync(id);
      showSuccess('Lavorato ripristinato con successo');
    } catch {
      showError('Errore durante il ripristino');
    }
  };

  const handlePurge = async (reason: string) => {
    if (!purgingProcessedProduct) return;

    try {
      await purgeProcessedProduct.mutateAsync({
        id: purgingProcessedProduct.id,
        reason,
      });
      showSuccess('Lavorato eliminato definitivamente');
      setPurgingProcessedProduct(null);
    } catch {
      showError('Errore durante l\'eliminazione definitiva');
    }
  };

  return (
    <div className="space-y-4" id="main-content" role="main" aria-label="Gestione prodotti lavorati">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Prodotti Lavorati</h1>
        {isAdmin && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nuovo Lavorato
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <SearchInput
          value={filters.search || ''}
          onChange={handleSearchChange}
          placeholder="Cerca lavorati..."
        />
        {isAdmin && (
          <ViewToggle view={filters.view ?? 'active'} onChange={handleViewChange} />
        )}
      </div>

      <div className="border rounded-md" role="region" aria-label="Tabella prodotti lavorati">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">
                <button onClick={() => handleSortChange('code')} className="font-medium hover:text-foreground">
                  Codice
                </button>
              </TableHead>
              <TableHead scope="col">Nome</TableHead>
              <TableHead scope="col">EAN</TableHead>
              <TableHead scope="col">Peso (kg)</TableHead>
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
                  Nessun lavorato trovato
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((item) => (
                <TableRow key={item.id} className={item.deletedAt ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.ean || '-'}</TableCell>
                  <TableCell>{item.weightPerBoxKg}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.deletedAt && isAdmin ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRestore(item.id)}
                          aria-label={`Ripristina lavorato ${item.name}`}
                          disabled={restoreProcessedProduct.isPending}
                        >
                          <RotateCcw className="h-4 w-4 text-green-600" aria-hidden="true" />
                        </Button>
                      ) : isAdmin ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(item)}
                            aria-label={`Modifica lavorato ${item.name}`}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingProcessedProduct(item)}
                            aria-label={`Elimina lavorato ${item.name}`}
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
                          onClick={() => setPurgingProcessedProduct(item)}
                          aria-label={`Elimina definitivamente lavorato ${item.name}`}
                          disabled={purgeProcessedProduct.isPending}
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
              {editingProcessedProduct ? 'Modifica Lavorato' : 'Nuovo Lavorato'}
            </DialogTitle>
            <DialogDescription id={`${formId}-description`}>
              {editingProcessedProduct
                ? 'Modifica i dettagli del lavorato'
                : 'Inserisci i dettagli del nuovo lavorato'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} id={formId}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="processed-code">Codice</Label>
                <Input id="processed-code" maxLength={14} {...register('code')} />
                {errors.code && <p className="text-sm text-red-600" role="alert">{errors.code.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="processed-name">Nome</Label>
                <Input id="processed-name" {...register('name')} />
                {errors.name && <p className="text-sm text-red-600" role="alert">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="processed-ean">EAN</Label>
                <Input id="processed-ean" {...register('ean')} />
                {errors.ean && <p className="text-sm text-red-600" role="alert">{errors.ean.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="processed-weight">Peso per collo (kg)</Label>
                <Input id="processed-weight" type="number" step="0.001" {...register('weightPerBoxKg')} />
                {errors.weightPerBoxKg && (
                  <p className="text-sm text-red-600" role="alert">
                    {errors.weightPerBoxKg.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="processed-description">Descrizione</Label>
                <Input id="processed-description" {...register('description')} />
              </div>

              <div className="space-y-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowConstraints(!showConstraints)}
                  className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/80"
                >
                  {showConstraints ? (
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  )}
                  Vincoli (opzionali)
                </button>
                {showConstraints && (
                  <>
                    <p className="text-sm text-foreground-muted">
                      Seleziona i prodotti, sottotipologie e varietà consentiti per questo lavorato.
                      Lascia vuoto per consentire tutti.
                    </p>

                    <div className="space-y-2">
                      <Label htmlFor="processed-products">Prodotti consentiti</Label>
                      <select
                        id="processed-products"
                        multiple
                        className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        {...register('allowedProductIds')}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                          setValue('allowedProductIds', selected);
                        }}
                      >
                        {(productsData ?? []).map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-foreground-muted">Tieni Ctrl/Cmd per selezionare più prodotti</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="processed-subtypes">Sottotipologie consentite</Label>
                      <select
                        id="processed-subtypes"
                        multiple
                        className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        {...register('allowedSubtypeIds')}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                          setValue('allowedSubtypeIds', selected);
                        }}
                      >
                        {(subtypesData ?? []).map((subtype) => (
                          <option key={subtype.id} value={subtype.id}>
                            {subtype.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="processed-varieties">Varietà consentite</Label>
                      <select
                        id="processed-varieties"
                        multiple
                        className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        {...register('allowedVarietyIds')}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                          setValue('allowedVarietyIds', selected);
                        }}
                      >
                        {(varietiesData ?? []).map((variety) => (
                          <option key={variety.id} value={variety.id}>
                            {variety.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={createProcessedProduct.isPending || updateProcessedProduct.isPending}
              >
                {createProcessedProduct.isPending || updateProcessedProduct.isPending
                  ? 'Salvataggio...'
                  : 'Salva'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingProcessedProduct} onOpenChange={() => setDeletingProcessedProduct(null)}>
        <DialogContent aria-describedby="delete-processed-description">
          <DialogHeader>
            <DialogTitle>Elimina Lavorato</DialogTitle>
            <DialogDescription id="delete-processed-description">
              Sei sicuro di voler eliminare il lavorato &quot;{deletingProcessedProduct?.name}&quot;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingProcessedProduct(null)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteProcessedProduct.isPending}>
              {deleteProcessedProduct.isPending ? 'Eliminazione...' : 'Elimina'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PurgeDialog
        open={!!purgingProcessedProduct}
        onOpenChange={(open) => {
          if (!open) setPurgingProcessedProduct(null);
        }}
        entityLabel="Lavorato"
        itemName={purgingProcessedProduct?.name || ''}
        pending={purgeProcessedProduct.isPending}
        onConfirm={handlePurge}
      />
    </div>
  );
}
