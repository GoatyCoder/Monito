import { useCallback, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Copy, KeyRound, Pencil, Plus, ShieldCheck, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination, SearchInput } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useCreateUser,
  useResetUserPassword,
  useUpdateUser,
  useUpdateUserStatus,
  useUsers,
  type UserFilters,
} from '@/hooks/use-users';
import { showError, showSuccess } from '@/lib/toast';
import type { Role, User } from '@monito/types';
import { useAuth } from '@/contexts/auth-context';

const userSchema = z.object({
  username: z.string().min(1, 'Username richiesto').max(32).regex(/^[A-Za-z0-9]+$/, 'Solo lettere e numeri'),
  firstName: z.string().min(1, 'Nome richiesto').max(50),
  surname: z.string().min(1, 'Cognome richiesto').max(50),
  role: z.enum(['USER', 'OPERATOR', 'ADMIN']),
});

type UserForm = z.infer<typeof userSchema>;

function roleLabel(role: Role): string {
  if (role === 'ADMIN') return 'Admin';
  if (role === 'OPERATOR') return 'Operatore';
  return 'Utente';
}

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const formId = useId();
  const [filters, setFilters] = useState<UserFilters>({ page: 1, limit: 20, search: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  const { data, isLoading } = useUsers(filters);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const updateStatus = useUpdateUserStatus();
  const resetPassword = useResetUserPassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserForm>({ resolver: zodResolver(userSchema), defaultValues: { role: 'USER' } });

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleSearchChange = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const openCreateDialog = () => {
    setEditingUser(null);
    reset({ username: '', firstName: '', surname: '', role: 'USER' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    reset({ username: user.username, firstName: user.firstName, surname: user.surname, role: user.role });
    setIsDialogOpen(true);
  };

  const onSubmit = async (formData: UserForm) => {
    try {
      if (editingUser) {
        await updateUser.mutateAsync({ id: editingUser.id, data: formData });
        showSuccess('Utente aggiornato');
      } else {
        const response = await createUser.mutateAsync(formData);
        setTemporaryPassword(response.temporaryPassword);
        showSuccess('Utente creato con password temporanea');
      }

      setIsDialogOpen(false);
      setEditingUser(null);
      reset();
    } catch {
      showError('Errore durante il salvataggio utente');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await updateStatus.mutateAsync({ id: user.id, isActive: !user.isActive });
      showSuccess(user.isActive ? 'Utente disattivato' : 'Utente riattivato');
    } catch {
      showError('Errore durante aggiornamento stato utente');
    }
  };

  const handleResetPassword = async (user: User) => {
    try {
      const result = await resetPassword.mutateAsync(user.id);
      setTemporaryPassword(result.temporaryPassword);
      showSuccess('Password temporanea generata');
    } catch {
      showError('Errore durante reset password');
    }
  };

  const handleCopyTemporaryPassword = async () => {
    if (!temporaryPassword) return;

    try {
      await navigator.clipboard.writeText(temporaryPassword);
      showSuccess('Password temporanea copiata');
    } catch {
      showError('Impossibile copiare la password');
    }
  };

  const users = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4" id="main-content" role="main" aria-label="Gestione utenti">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Utenti</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Nuovo utente
        </Button>
      </div>

      <SearchInput value={filters.search || ''} onChange={handleSearchChange} placeholder="Cerca utenti..." />

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Cognome</TableHead>
              <TableHead>Ruolo</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-foreground-muted py-8">
                  Caricamento...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-foreground-muted py-8">
                  Nessun utente trovato
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.firstName}</TableCell>
                  <TableCell>{user.surname}</TableCell>
                  <TableCell>{roleLabel(user.role)}</TableCell>
                  <TableCell>
                    <span className={user.isActive ? 'text-green-600' : 'text-red-600'}>
                      {user.isActive ? 'Attivo' : 'Disattivo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                        <Pencil className="w-4 h-4 mr-1" />
                        Modifica
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleResetPassword(user)}>
                        <KeyRound className="w-4 h-4 mr-1" />
                        Reset password
                      </Button>
                      <Button
                        variant={user.isActive ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleStatus(user)}
                        disabled={currentUser?.id === user.id}
                      >
                        {user.isActive ? (
                          <>
                            <ShieldX className="w-4 h-4 mr-1" />
                            Disattiva
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4 mr-1" />
                            Riattiva
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.totalPages > 1 && (
        <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={handlePageChange} />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent aria-describedby="users-dialog-description">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Modifica utente' : 'Nuovo utente'}</DialogTitle>
            <DialogDescription id="users-dialog-description">
              {editingUser
                ? 'Aggiorna i dati utente.'
                : 'Verrà generata una password temporanea alfanumerica, mostrata una sola volta.'}
            </DialogDescription>
          </DialogHeader>

          <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-username">Username</Label>
              <Input id="user-username" {...register('username')} aria-describedby={errors.username ? 'user-username-error' : undefined} />
              {errors.username && <p id="user-username-error" className="text-sm text-red-600" role="alert">{errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-first-name">Nome</Label>
              <Input id="user-first-name" {...register('firstName')} aria-describedby={errors.firstName ? 'user-first-name-error' : undefined} />
              {errors.firstName && <p id="user-first-name-error" className="text-sm text-red-600" role="alert">{errors.firstName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-surname">Cognome</Label>
              <Input id="user-surname" {...register('surname')} aria-describedby={errors.surname ? 'user-surname-error' : undefined} />
              {errors.surname && <p id="user-surname-error" className="text-sm text-red-600" role="alert">{errors.surname.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-role">Ruolo</Label>
              <select id="user-role" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('role')}>
                <option value="USER">Utente</option>
                <option value="OPERATOR">Operatore</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </form>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" form={formId} disabled={createUser.isPending || updateUser.isPending}>
              {editingUser ? 'Salva' : 'Crea utente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!temporaryPassword} onOpenChange={(open) => !open && setTemporaryPassword(null)}>
        <DialogContent aria-describedby="temp-password-description">
          <DialogHeader>
            <DialogTitle>Password temporanea</DialogTitle>
            <DialogDescription id="temp-password-description">
              Copia ora la password: non sarà più visibile.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm">
            {temporaryPassword}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCopyTemporaryPassword}>
              <Copy className="w-4 h-4 mr-2" />
              Copia password
            </Button>
            <Button onClick={() => setTemporaryPassword(null)}>Chiudi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
