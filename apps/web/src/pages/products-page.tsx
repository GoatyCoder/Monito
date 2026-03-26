import { useState, useCallback, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useRestoreProduct, ProductFilters } from '@/hooks/use-products';
import { showSuccess, showError } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination, SearchInput } from '@/components/ui/data-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Product } from '@monito/types';

const productSchema = z.object({
  code: z.string().min(1, 'Codice richiesto'),
  name: z.string().min(1, 'Nome richiesto'),
  description: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

export function ProductsPage() {
  const formId = useId();
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 20,
    search: '',
    sort: '',
    includeDeleted: false,
  });

  const { data, isLoading } = useProducts(filters);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const restoreProduct = useRestoreProduct();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
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

  const handleToggleIncludeDeleted = useCallback(() => {
    setFilters((prev) => ({ ...prev, includeDeleted: !prev.includeDeleted, page: 1 }));
  }, []);

  const handleRestore = async (id: string) => {
    try {
      await restoreProduct.mutateAsync(id);
      showSuccess('Prodotto ripristinato con successo');
    } catch {
      showError('Errore durante il ripristino');
    }
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      reset({ code: product.code, name: product.name, description: product.description || '' });
    } else {
      setEditingProduct(null);
      reset({ code: '', name: '', description: '' });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    reset({ code: '', name: '', description: '' });
  };

  const onSubmit = async (formData: ProductForm) => {
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, data: formData });
        showSuccess('Prodotto aggiornato con successo');
      } else {
        await createProduct.mutateAsync(formData);
        showSuccess('Prodotto creato con successo');
      }
      handleCloseDialog();
    } catch {
      showError('Errore durante il salvataggio');
    }
  };

  const handleDelete = async () => {
    if (deletingProduct) {
      try {
        await deleteProduct.mutateAsync(deletingProduct.id);
        showSuccess('Prodotto eliminato con successo');
        setDeletingProduct(null);
      } catch {
        showError('Errore durante l\'eliminazione');
      }
    }
  };

  return (
    <div className="space-y-4" id="main-content" role="main" aria-label="Gestione prodotti">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Prodotti</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Nuovo Prodotto
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <SearchInput
          value={filters.search || ''}
          onChange={handleSearchChange}
          placeholder="Cerca prodotti..."
        />
        <label className="flex items-center gap-2 text-sm text-foreground-muted cursor-pointer">
          <input
            type="checkbox"
            checked={filters.includeDeleted || false}
            onChange={handleToggleIncludeDeleted}
            className="rounded border-gray-300"
          />
          Mostra eliminati
        </label>
      </div>

      <div className="border rounded-md" role="region" aria-label="Tabella prodotti">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">
                <button
                  onClick={() => handleSortChange('code')}
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                  aria-sort={(filters.sort || '').startsWith('code') 
                    ? (filters.sort || '').endsWith('desc') ? 'descending' : 'ascending' 
                    : 'none'}
                >
                  Codice
                  {(filters.sort || '').startsWith('code') && (
                    <span className="text-xs" aria-hidden="true">
                      {(filters.sort || '').endsWith('desc') ? '↓' : '↑'}
                    </span>
                  )}
                </button>
              </TableHead>
              <TableHead scope="col">
                <button
                  onClick={() => handleSortChange('name')}
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                  aria-sort={(filters.sort || '').startsWith('name') 
                    ? (filters.sort || '').endsWith('desc') ? 'descending' : 'ascending' 
                    : 'none'}
                >
                  Nome
                  {(filters.sort || '').startsWith('name') && (
                    <span className="text-xs" aria-hidden="true">
                      {(filters.sort || '').endsWith('desc') ? '↓' : '↑'}
                    </span>
                  )}
                </button>
              </TableHead>
              <TableHead scope="col">Descrizione</TableHead>
              <TableHead scope="col" className="w-[100px]">Azioni</TableHead>
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
                  Nessun prodotto trovato
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((product) => (
                <TableRow key={product.id} className={product.deletedAt ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                  <TableCell className="font-medium">{product.code}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell className="text-foreground-muted">
                    {product.description || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {product.deletedAt ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRestore(product.id)}
                          aria-label={`Ripristina prodotto ${product.name}`}
                          disabled={restoreProduct.isPending}
                        >
                          <RotateCcw className="h-4 w-4 text-green-600" aria-hidden="true" />
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(product)}
                            aria-label={`Modifica prodotto ${product.name}`}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingProduct(product)}
                            aria-label={`Elimina prodotto ${product.name}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                          </Button>
                        </>
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
              {editingProduct ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
            </DialogTitle>
            <DialogDescription id={`${formId}-description`}>
              {editingProduct
                ? 'Modifica i dettagli del prodotto'
                : 'Inserisci i dettagli del nuovo prodotto'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} id={formId}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="product-code">Codice</Label>
                <Input
                  id="product-code"
                  aria-describedby={errors.code ? 'product-code-error' : undefined}
                  {...register('code')}
                />
                {errors.code && (
                  <p id="product-code-error" className="text-sm text-red-600" role="alert">
                    {errors.code.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-name">Nome</Label>
                <Input
                  id="product-name"
                  aria-describedby={errors.name ? 'product-name-error' : undefined}
                  {...register('name')}
                />
                {errors.name && (
                  <p id="product-name-error" className="text-sm text-red-600" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-description">Descrizione</Label>
                <Input
                  id="product-description"
                  {...register('description')}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annulla
              </Button>
              <Button 
                type="submit" 
                disabled={createProduct.isPending || updateProduct.isPending}
                aria-busy={createProduct.isPending || updateProduct.isPending}
              >
                {createProduct.isPending || updateProduct.isPending ? 'Salvataggio...' : 'Salva'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
        <DialogContent aria-describedby="delete-description">
          <DialogHeader>
            <DialogTitle>Elimina Prodotto</DialogTitle>
            <DialogDescription id="delete-description">
              Sei sicuro di voler eliminare il prodotto &quot;{deletingProduct?.name}&quot;? Potrai
              ripristinarlo dalla lista degli eliminati.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingProduct(null)}>
              Annulla
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={deleteProduct.isPending}
              aria-busy={deleteProduct.isPending}
            >
              {deleteProduct.isPending ? 'Eliminazione...' : 'Elimina'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}