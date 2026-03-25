import { createRouter, createRootRoute, createRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { AppLayout } from '@/components/layout/app-layout';
import { LoginPage } from '@/pages/login-page';
import { ProductsPage } from '@/pages/products-page';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { useEffect } from 'react';

const rootRoute = createRootRoute({
  component: () => (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function ProtectedRoute() {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!isLoading && !user) {
        navigate({ to: '/login' });
      }
    }, [user, isLoading, navigate]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    return (
      <AppLayout>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-foreground-muted">Benvenuto in Monito</p>
        </div>
      </AppLayout>
    );
  },
});

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products',
  component: function ProtectedRoute() {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!isLoading && !user) {
        navigate({ to: '/login' });
      }
    }, [user, isLoading, navigate]);

    if (isLoading || !user) {
      return (
        <AppLayout>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </AppLayout>
      );
    }

    return (
      <AppLayout>
        <ProductsPage />
      </AppLayout>
    );
  },
});

const varietiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/varieties',
  component: function ProtectedRoute() {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!isLoading && !user) {
        navigate({ to: '/login' });
      }
    }, [user, isLoading, navigate]);

    if (isLoading || !user) {
      return (
        <AppLayout>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </AppLayout>
      );
    }

    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Varietà</h1>
          </div>
          <p className="text-foreground-muted">Gestione varietà</p>
        </div>
      </AppLayout>
    );
  },
});

const packagingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/packagings',
  component: function ProtectedRoute() {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!isLoading && !user) {
        navigate({ to: '/login' });
      }
    }, [user, isLoading, navigate]);

    if (isLoading || !user) {
      return (
        <AppLayout>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </AppLayout>
      );
    }

    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Imballaggi</h1>
          </div>
          <p className="text-foreground-muted">Gestione imballaggi</p>
        </div>
      </AppLayout>
    );
  },
});

const processedProductsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/processed-products',
  component: function ProtectedRoute() {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!isLoading && !user) {
        navigate({ to: '/login' });
      }
    }, [user, isLoading, navigate]);

    if (isLoading || !user) {
      return (
        <AppLayout>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </AppLayout>
      );
    }

    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Prodotti Lavorati</h1>
          </div>
          <p className="text-foreground-muted">Gestione prodotti lavorati</p>
        </div>
      </AppLayout>
    );
  },
});

const fieldLotsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/field-lots',
  component: function ProtectedRoute() {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!isLoading && !user) {
        navigate({ to: '/login' });
      }
    }, [user, isLoading, navigate]);

    if (isLoading || !user) {
      return (
        <AppLayout>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </AppLayout>
      );
    }

    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Lotti di Campo</h1>
          </div>
          <p className="text-foreground-muted">Gestione lotti di campo</p>
        </div>
      </AppLayout>
    );
  },
});

const auditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/audit',
  component: function ProtectedRoute() {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!isLoading && !user) {
        navigate({ to: '/login' });
      }
    }, [user, isLoading, navigate]);

    if (isLoading || !user) {
      return (
        <AppLayout>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </AppLayout>
      );
    }

    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
          </div>
          <p className="text-foreground-muted">Registro attività</p>
        </div>
      </AppLayout>
    );
  },
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  indexRoute,
  productsRoute,
  varietiesRoute,
  packagingsRoute,
  processedProductsRoute,
  fieldLotsRoute,
  auditRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
