import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { BrandHeader } from '@/components/auth/brand-header';
import { UserIdentityCard } from '@/components/auth/user-identity-card';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import {
  getRecentUsersLocal,
  removeRecentUserLocal,
  type RecentUserLocalEntry,
} from '@/lib/recent-users';
import { showError } from '@/lib/toast';
import { type RecentUserHint } from '@monito/types';

const loginSchema = z.object({
  username: z.string().min(1, 'Username richiesto'),
  password: z.string().min(1, 'Password richiesta'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentEntries, setRecentEntries] = useState<RecentUserLocalEntry[]>([]);
  const [recentHints, setRecentHints] = useState<RecentUserHint[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [isManualLogin, setIsManualLogin] = useState(false);
  const [selectedRecentUser, setSelectedRecentUser] = useState<RecentUserHint | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const entries = getRecentUsersLocal();
    setRecentEntries(entries);

    if (entries.length === 0) {
      setRecentHints([]);
      return;
    }

    setIsLoadingRecent(true);
    api
      .post<{ data: RecentUserHint[] }>('/auth/recent-users/hints', {
        userIds: entries.map((entry) => entry.userId),
      })
      .then((response) => {
        const hintsById = new Map(response.data.data.map((hint) => [hint.id, hint]));
        const orderedHints = entries
          .map((entry) => hintsById.get(entry.userId))
          .filter((hint): hint is RecentUserHint => !!hint);

        setRecentHints(orderedHints);

        const unknownUserIds = entries
          .map((entry) => entry.userId)
          .filter((id) => !hintsById.has(id));
        unknownUserIds.forEach((id) => removeRecentUserLocal(id));
        if (unknownUserIds.length > 0) {
          setRecentEntries(getRecentUsersLocal());
        }
      })
      .catch(() => {
        setRecentHints([]);
      })
      .finally(() => setIsLoadingRecent(false));
  }, []);

  const recentUserCards = useMemo(() => {
    const byId = new Map(recentEntries.map((entry) => [entry.userId, entry.lastUsedAt]));
    return recentHints.map((hint) => ({
      ...hint,
      lastUsedAt: byId.get(hint.id),
    }));
  }, [recentEntries, recentHints]);

  const hasRecentUsers = recentUserCards.length > 0;
  const showRecentFlow = hasRecentUsers && !isManualLogin;

  useEffect(() => {
    if (!showRecentFlow || !selectedRecentUser) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFocus('password');
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [selectedRecentUser, setFocus, showRecentFlow]);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');
    try {
      const loggedUser = await login(data);
      navigate({ to: loggedUser.mustChangePassword ? '/change-password' : '/' });
    } catch (err: unknown) {
      const apiMessage =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;

      const normalizedError =
        apiMessage === 'User account is disabled'
          ? 'Account disattivato'
          : apiMessage === 'User not found'
            ? 'Utente non esistente'
            : apiMessage === 'Invalid password'
              ? 'Password non corretta'
              : 'Accesso non riuscito';

      showError(normalizedError);
      setError(normalizedError);
    } finally {
      setIsLoading(false);
    }
  };

  const useRecentUser = (user: RecentUserHint) => {
    if (!user.isActive) return;
    setError('');
    setSelectedRecentUser(user);
    setValue('username', user.username, { shouldValidate: true });
    setValue('password', '');
  };

  const removeRecent = (userId: string) => {
    removeRecentUserLocal(userId);
    setRecentEntries(getRecentUsersLocal());
    setRecentHints((prev) => prev.filter((hint) => hint.id !== userId));
    if (selectedRecentUser?.id === userId) {
      setSelectedRecentUser(null);
      setValue('username', '');
      setValue('password', '');
    }
  };

  const startManualLogin = () => {
    setIsManualLogin(true);
    setSelectedRecentUser(null);
    setError('');
    reset({ username: '', password: '' });
    setTimeout(() => setFocus('username'), 0);
  };

  const backToRecentUsers = () => {
    setIsManualLogin(false);
    setSelectedRecentUser(null);
    setError('');
    reset({ username: '', password: '' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8" role="main">
        <BrandHeader subtitle="Accedi al tuo account" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {error && (
            <div
              className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          {isLoadingRecent ? (
            <p className="text-sm text-foreground-muted" aria-live="polite">
              Caricamento operatori recenti...
            </p>
          ) : showRecentFlow ? (
            <div className="space-y-3" aria-label="Operatori recenti su questa postazione">
              {!selectedRecentUser && <p className="text-sm font-medium text-foreground">Operatori recenti</p>}

              {!selectedRecentUser ? (
                <div className="space-y-2">
                  {recentUserCards.map((hint) => (
                    <UserIdentityCard
                      key={hint.id}
                      firstName={hint.firstName}
                      surname={hint.surname}
                      username={hint.username}
                      avatarColor={hint.avatarColor}
                      onSelect={() => useRecentUser(hint)}
                      disabled={!hint.isActive}
                      action={
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeRecent(hint.id)}>
                          Rimuovi
                        </Button>
                      }
                      className={!hint.isActive ? 'opacity-60' : undefined}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <UserIdentityCard
                    firstName={selectedRecentUser.firstName}
                    surname={selectedRecentUser.surname}
                    username={selectedRecentUser.username}
                    avatarColor={selectedRecentUser.avatarColor}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <PasswordInput
                      id="password"
                      placeholder="Inserisci la tua password"
                      autoComplete="current-password"
                      aria-describedby={errors.password ? 'password-error' : undefined}
                      {...register('password')}
                    />
                    {errors.password && (
                      <p id="password-error" className="text-sm text-red-600" role="alert">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading} aria-busy={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                    Accedi
                  </Button>

                  <Button type="button" variant="ghost" className="w-full" onClick={backToRecentUsers}>
                    Torna all'elenco operatori recenti
                  </Button>
                </div>
              )}

              <Button type="button" variant="outline" className="w-full" onClick={startManualLogin}>
                Accedi con un altro utente
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Inserisci il tuo username"
                  autoComplete="username"
                  aria-describedby={errors.username ? 'username-error' : undefined}
                  {...register('username')}
                />
                {errors.username && (
                  <p id="username-error" className="text-sm text-red-600" role="alert">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  placeholder="Inserisci la tua password"
                  autoComplete="current-password"
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                />
                {errors.password && (
                  <p id="password-error" className="text-sm text-red-600" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading} aria-busy={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Accedi
              </Button>

              {hasRecentUsers && isManualLogin && (
                <Button type="button" variant="ghost" className="w-full" onClick={backToRecentUsers}>
                  Torna all'elenco operatori recenti
                </Button>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
}
