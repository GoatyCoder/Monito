import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Sidebar } from './sidebar';
import { SkipLink } from '@/components/skip-link';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import {
  clearLockScreenState,
  isLockScreenActiveForUser,
  setLockScreenActive,
  subscribeLockScreenSync,
} from '@/lib/lock-screen-sync';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { BrandHeader } from '@/components/auth/brand-header';
import { UserIdentityCard } from '@/components/auth/user-identity-card';
import { showError } from '@/lib/toast';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, preferences, logout } = useAuth();
  const navigate = useNavigate();
  const [isLocked, setIsLocked] = useState(false);
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLocked(false);
      clearLockScreenState();
      return;
    }

    if (isLockScreenActiveForUser(user.id)) {
      setIsLocked(true);
      return;
    }

    setIsLocked(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    return subscribeLockScreenSync((message) => {
      if (message.userId !== user.id) {
        return;
      }

      if (message.type === 'locked') {
        setIsLocked(true);
      } else {
        setIsLocked(false);
        setPassword('');
      }
    });
  }, [user]);

  useEffect(() => {
    if (!user || !preferences.lockScreenEnabled || isLocked) {
      return;
    }

    const timeoutMs = preferences.lockScreenTimeoutMinutes * 60 * 1000;

    const clearTimer = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };

    const armTimer = () => {
      clearTimer();
      timeoutRef.current = window.setTimeout(() => {
        setLockScreenActive(user.id);
        setIsLocked(true);
      }, timeoutMs);
    };

    const isAppActive = () => document.visibilityState === 'visible' && document.hasFocus();

    const handleActivity = () => {
      if (!isAppActive()) {
        return;
      }
      armTimer();
    };

    const handleVisibilityOrFocusChange = () => {
      if (isAppActive()) {
        armTimer();
      } else {
        clearTimer();
      }
    };

    if (!isAppActive()) {
      clearTimer();
    } else {
      armTimer();
    }

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('focus', handleVisibilityOrFocusChange);
    window.addEventListener('blur', handleVisibilityOrFocusChange);
    document.addEventListener('visibilitychange', handleVisibilityOrFocusChange);

    return () => {
      clearTimer();
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('focus', handleVisibilityOrFocusChange);
      window.removeEventListener('blur', handleVisibilityOrFocusChange);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocusChange);
    };
  }, [isLocked, preferences.lockScreenEnabled, preferences.lockScreenTimeoutMinutes, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (!preferences.lockScreenEnabled) {
      clearLockScreenState(user.id);
      setIsLocked(false);
      setPassword('');
    }
  }, [preferences.lockScreenEnabled, user]);

  const handleUnlock = async (event?: FormEvent) => {
    event?.preventDefault();
    setIsVerifying(true);
    try {
      await api.post('/auth/verify-password', { password });
      clearLockScreenState(user?.id);
      setPassword('');
      setIsLocked(false);
    } catch {
      showError('Password non valida');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSwitchOperator = () => {
    clearLockScreenState(user?.id);
    logout();
    navigate({ to: '/login' });
  };

  useEffect(() => {
    if (!isLocked) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isLocked]);

  return (
    <div className="flex h-screen bg-background relative">
      <SkipLink />
      <Sidebar className="w-64 flex-shrink-0" />
      <main 
        id="main-content" 
        className="flex-1 overflow-auto p-6" 
        tabIndex={-1}
      >
        {children}
      </main>

      {isLocked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background p-6">
          <div className="w-full max-w-md space-y-6">
            <BrandHeader subtitle="Schermata bloccata" />

            {user && (
              <UserIdentityCard
                firstName={user.firstName}
                surname={user.surname}
                username={user.username}
                avatarColor={user.avatarColor}
              />
            )}

            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lockscreen-password">Password</Label>
                <PasswordInput
                  id="lockscreen-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Inserisci la tua password"
                  ref={passwordInputRef}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isVerifying || password.trim().length === 0}>
                {isVerifying ? 'Verifica...' : 'Sblocca'}
              </Button>
              <Button type="button" className="w-full" variant="outline" onClick={handleSwitchOperator}>
                Cambia operatore
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
