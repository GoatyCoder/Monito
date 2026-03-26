import { createRoute, createRootRoute, createRouter, Outlet } from '@tanstack/react-router';
import { LoginPage } from '@/pages/login-page';
import { ProductsPage } from '@/pages/products-page';
import { VarietiesPage } from '@/pages/varieties-page';
import { PackagingsPage } from '@/pages/packagings-page';
import { ProcessedProductsPage } from '@/pages/processed-products-page';
import { FieldLotsPage } from '@/pages/field-lots-page';
import { AuditPage } from '@/pages/audit-page';
import { AccessibilityPage } from '@/pages/accessibility-page';
import { ProfilePage } from '@/pages/profile-page';
import { SettingsPage } from '@/pages/settings-page';
import { UsersPage } from '@/pages/users-page';
import { ChangePasswordPage } from '@/pages/change-password-page';
import { AuthProvider } from '@/contexts/auth-context';
import { AdminRoute, ProtectedRoute } from '@/components/layout/route-guards';

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
  component: () => (
    <ProtectedRoute>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-foreground-muted">Benvenuto in Monito</p>
      </div>
    </ProtectedRoute>
  ),
});

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products',
  component: () => (
    <ProtectedRoute>
      <ProductsPage />
    </ProtectedRoute>
  ),
});

const varietiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/varieties',
  component: () => (
    <ProtectedRoute>
      <VarietiesPage />
    </ProtectedRoute>
  ),
});

const packagingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/packagings',
  component: () => (
    <ProtectedRoute>
      <PackagingsPage />
    </ProtectedRoute>
  ),
});

const processedProductsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/processed-products',
  component: () => (
    <ProtectedRoute>
      <ProcessedProductsPage />
    </ProtectedRoute>
  ),
});

const fieldLotsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/field-lots',
  component: () => (
    <ProtectedRoute>
      <FieldLotsPage />
    </ProtectedRoute>
  ),
});

const palletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pallets',
  component: () => (
    <ProtectedRoute>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Pedane</h1>
        <p className="text-foreground-muted">Gestione pedane</p>
      </div>
    </ProtectedRoute>
  ),
});

const auditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/audit',
  component: () => (
    <AdminRoute>
      <AuditPage />
    </AdminRoute>
  ),
});

const accessibilityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accessibility',
  component: () => (
    <ProtectedRoute>
      <AccessibilityPage />
    </ProtectedRoute>
  ),
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: () => (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: () => (
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  ),
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: () => (
    <AdminRoute>
      <UsersPage />
    </AdminRoute>
  ),
});

const changePasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/change-password',
  component: () => (
    <ProtectedRoute>
      <ChangePasswordPage />
    </ProtectedRoute>
  ),
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  indexRoute,
  productsRoute,
  varietiesRoute,
  packagingsRoute,
  processedProductsRoute,
  fieldLotsRoute,
  palletsRoute,
  auditRoute,
  accessibilityRoute,
  profileRoute,
  settingsRoute,
  usersRoute,
  changePasswordRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
