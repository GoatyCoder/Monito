import { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Package,
  Leaf,
  Box,
  PackageCheck,
  Warehouse,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Accessibility,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserMenu } from './user-menu';
import { useAuth } from '@/contexts/auth-context';

interface NavItem {
  title: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Anagrafica: true,
  });

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const username = user ? `${user.firstName} ${user.surname}` : 'Utente';
  const isAdmin = user?.role === 'ADMIN';

  const navigation: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      title: 'Anagrafica',
      icon: Package,
      children: [
        { title: 'Prodotti', href: '/products', icon: Package },
        { title: 'Varietà', href: '/varieties', icon: Leaf },
        { title: 'Imballaggi', href: '/packagings', icon: Box },
        { title: 'Lavorati', href: '/processed-products', icon: PackageCheck },
        { title: 'Lotti', href: '/field-lots', icon: Warehouse },
        { title: 'Pedane', href: '/pallets', icon: ClipboardList },
        ...(isAdmin ? [{ title: 'Utenti', href: '/users', icon: Users } as NavItem] : []),
      ],
    },
    ...(isAdmin
      ? [
          {
            title: 'Audit Log',
            href: '/audit',
            icon: ClipboardList,
          } as NavItem,
        ]
      : []),
    {
      title: 'Accessibilità',
      href: '/accessibility',
      icon: Accessibility,
    },
  ];

  return (
    <div className={cn('flex flex-col h-full bg-surface border-r border-border', className)}>
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-sm">M</span>
        </div>
        <span className="text-lg font-bold text-foreground">Monito</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Navigazione principale">
        {navigation.map((item) => (
          <div key={item.title}>
            {item.children ? (
              <div>
                <button
                  onClick={() => toggleSection(item.title)}
                  aria-expanded={openSections[item.title]}
                  className={cn(
                    'flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    'text-foreground-muted hover:bg-secondary hover:text-secondary-foreground'
                  )}
                >
                  {item.icon && <item.icon className="w-5 h-5" />}
                  <span className="flex-1 text-left">{item.title}</span>
                  {openSections[item.title] ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                {openSections[item.title] && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                          isActive(child.href)
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground-muted hover:bg-secondary hover:text-secondary-foreground'
                        )}
                      >
                        {child.icon && <child.icon className="w-4 h-4" />}
                        {child.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive(item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground-muted hover:bg-secondary hover:text-secondary-foreground'
                )}
              >
                {item.icon && <item.icon className="w-5 h-5" />}
                {item.title}
              </Link>
            )}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <UserMenu username={username} avatarColor={user?.avatarColor} />
      </div>
    </div>
  );
}
