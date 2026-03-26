import { ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { AppLayout } from './app-layout';
import { useAuth } from '@/contexts/auth-context';

function LoadingScreen(): ReactNode {
  return (
    <AppLayout>
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </AppLayout>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }): ReactNode {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: '/login' });
      return;
    }

    if (!isLoading && user?.mustChangePassword && location.pathname !== '/change-password') {
      navigate({ to: '/change-password' });
      return;
    }

    if (!isLoading && user && !user.mustChangePassword && location.pathname === '/change-password') {
      navigate({ to: '/' });
    }
  }, [isLoading, location.pathname, navigate, user]);

  if (isLoading || !user) {
    return <LoadingScreen />;
  }

  return <AppLayout>{children}</AppLayout>;
}

export function AdminRoute({ children }: { children: ReactNode }): ReactNode {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: '/login' });
      return;
    }

    if (!isLoading && user && user.role !== 'ADMIN') {
      navigate({ to: '/' });
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user) {
    return <LoadingScreen />;
  }

  if (user.role !== 'ADMIN') {
    return null;
  }

  return <AppLayout>{children}</AppLayout>;
}
