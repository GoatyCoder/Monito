import { useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserCircle, LogOut, Save } from 'lucide-react';
import { AVATAR_COLORS, type AvatarColor } from '@monito/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { showError, showSuccess } from '@/lib/toast';

function roleLabel(role: string): string {
  if (role === 'ADMIN') return 'Amministratore';
  if (role === 'OPERATOR') return 'Operatore';
  return 'Utente';
}

const profileSchema = z.object({
  firstName: z.string().min(1, 'Nome richiesto').max(50, 'Massimo 50 caratteri'),
  surname: z.string().min(1, 'Cognome richiesto').max(50, 'Massimo 50 caratteri'),
  username: z
    .string()
    .min(1, 'Username richiesto')
    .max(32, 'Massimo 32 caratteri')
    .regex(/^[A-Za-z0-9]+$/, 'Solo lettere e numeri'),
  avatarColor: z.enum(['blue', 'green', 'violet', 'orange', 'red', 'pink', 'gray']),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Password attuale obbligatoria'),
    newPassword: z.string().min(6, 'Nuova password minima 6 caratteri'),
    confirmPassword: z.string().min(6, 'Conferma password obbligatoria'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Le password non coincidono',
    path: ['confirmPassword'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

function toApiAvatarColor(value: AvatarColor): string {
  return value.toUpperCase();
}

export function ProfilePage() {
  const { user, logout, refreshCurrentUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      surname: '',
      username: '',
      avatarColor: 'gray',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!user) return;
    setValue('firstName', user.firstName);
    setValue('surname', user.surname);
    setValue('username', user.username);
    setValue('avatarColor', user.avatarColor ?? 'gray');
  }, [setValue, user]);

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  if (!user) {
    return null;
  }

  const selectedColor = watch('avatarColor');

  const onSubmit = async (data: ProfileForm) => {
    try {
      await api.patch('/users/me', {
        firstName: data.firstName.trim(),
        surname: data.surname.trim(),
        username: data.username.trim(),
        avatarColor: toApiAvatarColor(data.avatarColor),
      });

      await refreshCurrentUser();
      showSuccess('Profilo aggiornato con successo');
    } catch {
      showError('Errore durante l\'aggiornamento del profilo');
    }
  };

  const onSubmitPassword = async (data: PasswordForm) => {
    try {
      await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      resetPasswordForm();
      await refreshCurrentUser();
      showSuccess('Password aggiornata con successo');
    } catch {
      showError('Errore durante cambio password');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6" id="main-content" role="main" aria-label="Profilo utente">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-foreground-muted">
          <UserCircle className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm">Account</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Profilo</h1>
        <p className="text-foreground-muted">Aggiorna i dati del tuo account e scegli il colore avatar.</p>
      </header>

      <form
        className="rounded-md border border-border bg-surface p-4 space-y-5"
        aria-label="Dati anagrafici utente"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h2 className="text-lg font-semibold text-foreground">Dati utente</h2>

        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback
              className="text-white text-base"
              style={{
                backgroundColor: AVATAR_COLORS.find((c) => c.value === selectedColor)?.hex ?? '#6B7280',
              }}
            >
              {`${watch('firstName').charAt(0)}${watch('surname').charAt(0)}`.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-foreground">{watch('firstName')} {watch('surname')}</p>
            <p className="text-xs text-foreground-muted">Ruolo: {roleLabel(user.role)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-first-name">Nome</Label>
            <Input id="profile-first-name" {...register('firstName')} aria-describedby={errors.firstName ? 'profile-first-name-error' : undefined} />
            {errors.firstName && <p id="profile-first-name-error" className="text-sm text-red-600" role="alert">{errors.firstName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-surname">Cognome</Label>
            <Input id="profile-surname" {...register('surname')} aria-describedby={errors.surname ? 'profile-surname-error' : undefined} />
            {errors.surname && <p id="profile-surname-error" className="text-sm text-red-600" role="alert">{errors.surname.message}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="profile-username">Username</Label>
            <Input id="profile-username" {...register('username')} aria-describedby={errors.username ? 'profile-username-error' : undefined} />
            {errors.username && <p id="profile-username-error" className="text-sm text-red-600" role="alert">{errors.username.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Colore avatar</Label>
          <div className="grid grid-cols-4 gap-2 md:grid-cols-7">
            {AVATAR_COLORS.map((color) => (
              <label
                key={color.value}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2 text-xs"
                style={{
                  outline: selectedColor === color.value ? `2px solid ${color.hex}` : undefined,
                }}
              >
                <input type="radio" value={color.value} {...register('avatarColor')} className="sr-only" />
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: color.hex }} aria-hidden="true" />
                <span>{color.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            {isSubmitting ? 'Salvataggio...' : 'Salva profilo'}
          </Button>
        </div>
      </form>

      <form
        className="rounded-md border border-border bg-surface p-4 space-y-4"
        aria-label="Cambio password"
        onSubmit={handleSubmitPassword(onSubmitPassword)}
      >
        <h2 className="text-lg font-semibold text-foreground">Cambia password</h2>
        <p className="text-sm text-foreground-muted">
          Imposta una nuova password per il tuo account.
        </p>

        <div className="space-y-2">
          <Label htmlFor="profile-current-password">Password attuale</Label>
          <PasswordInput
            id="profile-current-password"
            autoComplete="current-password"
            {...registerPassword('currentPassword')}
            aria-describedby={passwordErrors.currentPassword ? 'profile-current-password-error' : undefined}
          />
          {passwordErrors.currentPassword && (
            <p id="profile-current-password-error" className="text-sm text-red-600" role="alert">
              {passwordErrors.currentPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-new-password">Nuova password</Label>
          <PasswordInput
            id="profile-new-password"
            autoComplete="new-password"
            {...registerPassword('newPassword')}
            aria-describedby={passwordErrors.newPassword ? 'profile-new-password-error' : undefined}
          />
          {passwordErrors.newPassword && (
            <p id="profile-new-password-error" className="text-sm text-red-600" role="alert">
              {passwordErrors.newPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-confirm-password">Conferma nuova password</Label>
          <PasswordInput
            id="profile-confirm-password"
            autoComplete="new-password"
            {...registerPassword('confirmPassword')}
            aria-describedby={passwordErrors.confirmPassword ? 'profile-confirm-password-error' : undefined}
          />
          {passwordErrors.confirmPassword && (
            <p id="profile-confirm-password-error" className="text-sm text-red-600" role="alert">
              {passwordErrors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmittingPassword} aria-busy={isSubmittingPassword}>
            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            {isSubmittingPassword ? 'Salvataggio...' : 'Aggiorna password'}
          </Button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Link to="/settings">
          <Button variant="outline">
            Vai a impostazioni
          </Button>
        </Link>
        <Button variant="destructive" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          Esci
        </Button>
      </div>
    </div>
  );
}
