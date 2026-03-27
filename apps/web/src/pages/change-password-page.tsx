import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { api } from '@/lib/api';
import { showError, showSuccess } from '@/lib/toast';
import { useAuth } from '@/contexts/auth-context';

const schema = z
  .object({
    currentPassword: z.string().min(6, 'Password attuale obbligatoria'),
    newPassword: z.string().min(6, 'Nuova password minima 6 caratteri'),
    confirmPassword: z.string().min(6, 'Conferma password obbligatoria'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Le password non coincidono',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { refreshCurrentUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormData) => {
    setIsSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      await refreshCurrentUser();
      showSuccess('Password aggiornata con successo');
      navigate({ to: '/' });
    } catch {
      showError('Errore durante cambio password');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6" id="main-content" role="main" aria-label="Cambio password">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Cambia password</h1>
        <p className="text-foreground-muted">
          Devi aggiornare la password temporanea prima di continuare.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-password">Password attuale</Label>
          <PasswordInput id="current-password" autoComplete="current-password" {...register('currentPassword')} />
          {errors.currentPassword && (
            <p className="text-sm text-red-600" role="alert">
              {errors.currentPassword.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">Nuova password</Label>
          <PasswordInput id="new-password" autoComplete="new-password" {...register('newPassword')} />
          {errors.newPassword && (
            <p className="text-sm text-red-600" role="alert">
              {errors.newPassword.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Conferma nuova password</Label>
          <PasswordInput id="confirm-password" autoComplete="new-password" {...register('confirmPassword')} />
          {errors.confirmPassword && (
            <p className="text-sm text-red-600" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
        <Button type="submit" disabled={isSaving} aria-busy={isSaving}>
          {isSaving ? 'Salvataggio...' : 'Aggiorna password'}
        </Button>
      </form>
    </div>
  );
}
