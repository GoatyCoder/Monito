# FRONTEND.md — Frontend Guidelines

Linee guida tecniche complete per lo sviluppo del frontend Monito.

---

## 1. Stack tecnologico

| Tecnologia | Versione | Note |
|---|---|---|
| React | ^19 | Framework UI |
| TypeScript | ^5.5 | strict mode |
| TanStack Router | latest | Routing type-safe |
| TanStack Query | latest | Server state management |
| shadcn/ui | latest | Component library (Radix UI) |
| Tailwind CSS | ^3.4 | Styling |
| React Hook Form | latest | Form handling |
| Zod | latest | Schema validation |
| Axios | latest | HTTP client |
| Lucide React | latest | Icone |
| sonner | latest | Toast notifications |

---

## 2. Struttura del progetto

```
apps/web/
├── src/
│   ├── components/
│   │   ├── ui/                    # Componenti shadcn/ui riutilizzabili
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── data-table.tsx     # Pagination, SearchInput, TableSortHeader
│   │   │   └── label.tsx
│   │   └── layout/                # Componenti di layout
│   │       ├── sidebar.tsx
│   │       ├── app-layout.tsx
│   │       └── user-menu.tsx
│   ├── contexts/                  # React Context
│   │   └── auth-context.tsx
│   ├── hooks/                     # TanStack Query hooks
│   │   ├── use-products.ts        # CRUD hooks con filtri
│   │   └── use-*.ts
│   ├── lib/                       # Utility
│   │   ├── api.ts                 # Axios client con interceptors
│   │   ├── utils.ts               # cn() utility
│   │   └── toast.ts               # showSuccess, showError, showInfo
│   ├── pages/                     # Page components
│   │   ├── login-page.tsx
│   │   ├── products-page.tsx
│   │   └── ...
│   ├── router.tsx                 # TanStack Router config
│   ├── main.tsx                   # Entry point
│   └── index.css                  # CSS + Tailwind variabili
├── index.html
├── tailwind.config.js
├── postcss.config.js
└── vite.config.ts
```

---

## 3. Convenzioni Naming

- **Componenti**: `PascalCase` (es. `ProductsPage`, `UserMenu`)
- **Hooks**: `camelCase` con prefisso `use` (es. `useProducts`, `useAuth`)
- **File**: `kebab-case` (es. `products-page.tsx`, `use-products.ts`)
- **Utility**: `camelCase` (es. `api.ts`, `utils.ts`, `toast.ts`)

---

## 4. Design System

### Colori brand

Definiti in `tailwind.config.js` e `index.css`:

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#0F766E',      // Teal 700
        hover: '#0D6660',
        foreground: '#FFFFFF',
      },
      avatar: {
        blue: '#3B82F6',
        green: '#10B981',
        violet: '#8B5CF6',
        orange: '#F97316',
        red: '#EF4444',
        pink: '#EC4899',
        gray: '#6B7280',
      },
    },
  },
}
```

```css
/* index.css */
@layer base {
  :root {
    --color-primary: 15 118 110;
    --color-background: 248 250 252;
    --color-surface: 255 255 255;
    --color-foreground: 30 41 59;
    --color-foreground-muted: 100 116 139;
    --color-border: 226 232 240;
  }
}
```

### Utilizzo

```html
<Button className="bg-primary hover:bg-primary-hover">Salva</Button>
<Avatar className="bg-avatar-pink" />
```

### Typography

- **Font**: Inter (sans-serif), JetBrains Mono (codice)
- Settato in `index.html` tramite Google Fonts

---

## 5. Componenti shadcn/ui

I componenti UI sono in `components/ui/`. Segui lo standard shadcn/ui:

```typescript
// Esempio struttura componente
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn('classi base', className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
```

---

## 6. TanStack Router

### Configurazione base

```typescript
// router.tsx
import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/layout/app-layout';

const rootRoute = createRootRoute({
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <DashboardPage />,
});

const routeTree = rootRoute.addChildren([indexRoute]);
export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
```

### Protezione route

```typescript
const protectedRoute = createRoute({
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
      return <LoadingSpinner />;
    }

    return <ProductsPage />;
  },
});
```

---

## 7. TanStack Query

### Hooks CRUD con filtri

```typescript
// hooks/use-products.ts
export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

export function useProducts(filters: ProductFilters = {}) {
  const { page = 1, limit = 20, search = '', sort = '' } = filters;
  
  return useQuery({
    queryKey: ['products', { page, limit, search, sort }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (search) params.append('search', search);
      if (sort) params.append('sort', sort);
      
      const response = await api.get<{ data: Product[]; meta: {...} }>(`/products?${params.toString()}`);
      return response.data;
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProductDto) => {
      const response = await api.post<{ data: Product }>('/products', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
```

### QueryClientProvider setup

```typescript
// main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minuti
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
);
```

---

## 8. Autenticazione

### AuthContext

```typescript
// contexts/auth-context.tsx
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  updateAvatarColor: (color: AvatarColor) => Promise<void>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carica utente da token JWT
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.get<{ data: User }>('/users/me')
        .then((res) => setUser(res.data.data))
        .catch(() => { /* logout */ })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (data: LoginRequest) => {
    const response = await api.post<{ data: LoginResponse }>('/auth/login', data);
    const { accessToken, refreshToken, user: userData } = response.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
  };

  // ... logout, updateAvatarColor
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

### API client con interceptors

```typescript
// lib/api.ts
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Refresh token logic
    }
    return Promise.reject(error);
  }
);
```

---

## 9. Toast Notifications

Usa `sonner` per le notifiche:

```typescript
// lib/toast.ts
import { toast } from 'sonner';

export const showSuccess = (message: string) => toast.success(message);
export const showError = (message: string) => toast.error(message);
export const showInfo = (message: string) => toast.info(message);
```

Integrazione in `main.ts`:

```typescript
import { Toaster } from '@/components/ui/toast';

<RouterProvider router={router} />
<Toaster position="bottom-right" />
```

Utilizzo nelle pagine:

```typescript
import { showSuccess, showError } from '@/lib/toast';

const onSubmit = async (data) => {
  try {
    await createProduct.mutateAsync(data);
    showSuccess('Prodotto creato con successo');
  } catch {
    showError('Errore durante il salvataggio');
  }
};
```

---

## 10. Form con React Hook Form + Zod

```typescript
// pages/products-page.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const productSchema = z.object({
  code: z.string().min(1, 'Codice richiesto'),
  name: z.string().min(1, 'Nome richiesto'),
  description: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

export function ProductsPage() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
  });

  const onSubmit = async (data: ProductForm) => {
    await createProduct.mutateAsync(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('code')} />
      {errors.code && <p className="text-sm text-red-600">{errors.code.message}</p>}
      ...
    </form>
  );
}
```

---

## 11. UI Pattern comuni

### Tabella con Paginazione, Ricerca e Ordinamento

```typescript
// pages/products-page.tsx
const [filters, setFilters] = useState<ProductFilters>({
  page: 1,
  limit: 20,
  search: '',
  sort: '',
});

const { data, isLoading } = useProducts(filters);

const handlePageChange = (page: number) => {
  setFilters((prev) => ({ ...prev, page }));
};

const handleSearchChange = (search: string) => {
  setFilters((prev) => ({ ...prev, search, page: 1 }));
};

const handleSortChange = (column: string) => {
  setFilters((prev) => {
    const currentSort = prev.sort || '';
    const isActive = currentSort.startsWith(column);
    const direction = isActive && currentSort.endsWith('desc') ? 'asc' : 'desc';
    return { ...prev, sort: `${column}_${direction}`, page: 1 };
  });
};

return (
  <div className="space-y-4">
    <div className="flex items-center gap-4">
      <SearchInput value={filters.search || ''} onChange={handleSearchChange} />
    </div>

    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <button onClick={() => handleSortChange('code')}>
              Codice {filters.sort?.startsWith('code') && (filters.sort.endsWith('desc') ? '↓' : '↑')}
            </button>
          </TableHead>
          ...
        </TableRow>
      </TableHeader>
      <TableBody>...</TableBody>
    </Table>

    <Pagination
      page={data?.meta.page || 1}
      totalPages={data?.meta.totalPages || 1}
      onPageChange={handlePageChange}
    />
  </div>
);
```

### CRUD con Dialog

```typescript
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [editingItem, setEditingItem] = useState<Item | null>(null);

const handleOpenDialog = (item?: Item) => {
  setEditingItem(item || null);
  if (item) reset(item);
  else reset({ code: '', name: '' });
  setIsDialogOpen(true);
};

<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{editingItem ? 'Modifica' : 'Nuovo'}</DialogTitle>
    </DialogHeader>
    <form onSubmit={handleSubmit(onSubmit)}>...</form>
  </DialogContent>
</Dialog>
```

---

## 12. Componenti UI Personalizzati

### Pagination

```typescript
// components/ui/data-table.tsx
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  // ... renderizza pulsanti navigazione
}
```

### SearchInput

```typescript
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounce?: number;
}

export function SearchInput({ value, onChange, placeholder, debounce }: SearchInputProps) {
  // Implementa debounce automatico
}
```

---

## 13. Variabili d'ambiente

```env
VITE_API_URL=http://localhost:3000/api/v1
```

---

## 14. Accessibilità (WCAG 2.1 AA + European Accessibility Act)

### Normative di riferimento

| Normativa | Requisito | Note |
|-----------|-----------|------|
| WCAG 2.1 | Level AA | Standard base |
| European Accessibility Act | WCAG 2.1 AA | In vigore dal 28/06/2025 |
| AGID | WCAG 2.1 (obiettivo 2.2) | Per PA e privati |

### Principi WCAG

1. **Percepibile** - Informazioni presentate in modo percepibile
2. **Utilizzabile** - Componenti UI utilizzabili
3. **Comprensibile** - Contenuti comprensibili
4. **Robusto** - Contenuti interpretabili da tecnologie assistive

### Regole generali

- ✅ Usa elementi semanticamente corretti (`<button>`, `<input>`, `<table>`, `<nav>`, `<main>`, `<header>`, `<footer>`)
- ✅ Aggiungi `aria-label` ai bottoni senza testo visivo
- ✅ Usa `aria-describedby` per associare messaggi di errore ai campi input
- ✅ Usa `role="alert"` o `role="status"` per messaggi dinamici
- ✅ Mantieni contrasto colori >= 4.5:1 (il design system lo garantisce)
- ✅ Non affidarti solo al colore per comunicare stato
- ✅ Usa `aria-busy` durante caricamenti
- ✅ Usa `aria-live` per notifiche e messaggi
- ✅ Imposta `lang="it"` nell'HTML
- ✅ Usa `aria-hidden="true"` per icone decorative
- ✅ Usa `aria-expanded` per elementi espandibili (accordion, dropdown)
- ✅ Tutte le pagine devono avere un titolo descrittivo
- ✅ Focus trap nei dialog (Radix UI lo gestisce automaticamente)

### Skip Link

Aggiungi un link per saltare la navigazione all'inizio della pagina:

```typescript
// components/skip-link.tsx
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed ..."
    >
      Vai al contenuto principale
    </a>
  );
}
```

### Form con errori accessibili

```typescript
// Input con aria-describedby per errore
<Label htmlFor="code">Codice</Label>
<Input 
  id="code" 
  {...register('code')} 
  aria-describedby={errors.code ? 'code-error' : undefined}
/>
{errors.code && (
  <p id="code-error" className="text-sm text-red-600" role="alert">
    {errors.code.message}
  </p>
)}
```

### Tabella accessibile

```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">  // scope="col" per intestazioni colonna
        <button 
          onClick={() => handleSortChange('code')}
          aria-sort={isActive ? direction === 'asc' ? 'ascending' : 'descending' : 'none'}
        >
          Codice
          {isActive && <span aria-hidden="true">{direction === 'asc' ? '↑' : '↓'}</span>}
        </button>
      </TableHead>
    </TableRow>
  </TableHeader>
</Table>
```

### Button con aria-label

```typescript
// Icona decorativa - nascondi da screen reader
<Button 
  variant="ghost" 
  size="icon" 
  onClick={() => handleEdit(item)} 
  aria-label={`Modifica ${item.name}`}
>
  <Pencil className="h-4 w-4" aria-hidden="true" />
</Button>

// Icone in elementi espandibili
<button 
  aria-expanded={isOpen}
  aria-controls="section-id"
>
  {isOpen ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
  Sezione
</button>
```

### Icone decorative

```typescript
// Icone senza significato - usa aria-hidden
<Search className="h-4 w-4" aria-hidden="true" />

// Icone con significato - usa aria-label
<Search className="h-4 w-4" aria-label="Cerca" />
```

### Loading states

```typescript
// Annuncia caricamento
<TableBody aria-busy={isLoading}>
  ...
</TableBody>

// Annuncia stato di caricamento
<div aria-live="polite" className="sr-only">
  {isLoading ? 'Caricamento in corso...' : ''}
</div>
```

### Dialog accessibili

```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent aria-describedby="dialog-description">
    <DialogHeader>
      <DialogTitle id="dialog-title">Titolo</DialogTitle>
      <DialogDescription id="dialog-description">
        Descrizione del dialog
      </DialogDescription>
    </DialogHeader>
    ...
  </DialogContent>
</Dialog>
```

### Checklist accessibilità per ogni PR

- [ ] Skip link presente nella pagina
- [ ] Tutti i button/icon hanno aria-label
- [ ] Icone decorative hanno aria-hidden="true"
- [ ] Form fields hanno label associata con htmlFor
- [ ] Errori form hanno role="alert" e sono collegati con aria-describedby
- [ ] Tabelle usano scope="col" nelle intestazioni
- [ ] Sorting ha aria-sort
- [ ] Loading states hanno aria-busy
- [ ] Elementi espandibili hanno aria-expanded
- [ ] Messaggi dinamici usano aria-live
- [ ] Contrast colori >= 4.5:1
- [ ] Navigazione da tastiera funziona
- [ ] Focus visibile su tutti gli elementi interattivi
- [ ] lang="it" impostato in HTML
- [ ] Titolo pagina descrittivo

---

## 15. Comandi

```bash
cd apps/web
pnpm run dev      # Avvio dev server (porta 5173)
pnpm run build    # Build production
pnpm run typecheck # TypeScript check
pnpm run lint     # Linting
```

---

## 16. Checklist prima di ogni PR

- [ ] TypeScript compila senza errori (`pnpm run typecheck`)
- [ ] Nessun console.log o debug code
- [ ] Form con validazione Zod
- [ ] Loading states durante chiamate API
- [ ] Error handling con toast (`showError`)
- [ ] Success feedback con toast (`showSuccess`)
- [ ] TanStack Query invalidates dopo operazioni CRUD
- [ ] Protezione route con AuthContext
- [ ] Paginazione, ricerca, ordinamento nelle tabelle
- [ ] Componenti riutilizzabili in `components/ui/`
- [ ] Naming conventions rispettati
- [ ] Accessibilità: aria-label, semantic HTML