import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input, type InputProps } from '@/components/ui/input';

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  showLabel?: string;
  hideLabel?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showLabel = 'Mostra password', hideLabel = 'Nascondi password', ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type={isVisible ? 'text' : 'password'}
          className={cn('pr-10', className)}
        />
        <button
          type="button"
          aria-label={isVisible ? hideLabel : showLabel}
          onClick={() => setIsVisible((prev) => !prev)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isVisible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
