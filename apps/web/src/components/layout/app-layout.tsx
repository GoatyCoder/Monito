import { Sidebar } from './sidebar';
import { SkipLink } from '@/components/skip-link';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <SkipLink />
      <Sidebar className="w-64 flex-shrink-0" />
      <main 
        id="main-content" 
        className="flex-1 overflow-auto p-6" 
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}