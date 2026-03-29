import * as React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-sm text-foreground-muted">
        Pagina {page} di {totalPages}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          aria-label="Prima pagina"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Pagina precedente"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? 'default' : 'ghost'}
            size="icon"
            onClick={() => onPageChange(p)}
            aria-label={`Pagina ${p}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Pagina successiva"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          aria-label="Ultima pagina"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounce?: number;
}

export function SearchInput({ value, onChange, placeholder = 'Cerca...', debounce = 300 }: SearchInputProps) {
  const [localValue, setLocalValue] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, debounce);
    return () => clearTimeout(timer);
  }, [localValue, onChange, debounce]);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
      <Input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 w-[250px]"
        aria-label={placeholder}
      />
    </div>
  );
}

interface TableSortProps {
  column: string;
  currentSort: string;
  onSort: (column: string) => void;
}

export function TableSortHeader({ column, currentSort, onSort }: TableSortProps) {
  const isActive = currentSort.startsWith(column);
  const direction = isActive && currentSort.startsWith(`${column}_desc`) ? 'desc' : 'asc';

  return (
    <button
      onClick={() => onSort(column)}
      className={cn(
        'flex items-center gap-1 font-medium transition-colors hover:text-foreground',
        isActive && 'text-primary'
      )}
      aria-sort={isActive ? direction === 'asc' ? 'ascending' : 'descending' : 'none'}
    >
      <span>{column}</span>
      {isActive && (
        <span className="text-xs">{direction === 'asc' ? '↑' : '↓'}</span>
      )}
    </button>
  );
}