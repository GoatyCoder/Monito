import type { ReactNode } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { AVATAR_COLORS, type AvatarColor } from '@monito/types';

interface UserIdentityCardProps {
  firstName: string;
  surname: string;
  username: string;
  avatarColor?: AvatarColor;
  action?: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  className?: string;
}

export function UserIdentityCard({
  firstName,
  surname,
  username,
  avatarColor,
  action,
  onSelect,
  disabled,
  className,
}: UserIdentityCardProps) {
  const identityContent = (
    <>
      <Avatar className="h-8 w-8">
        <AvatarFallback
          className="text-white"
          style={{
            backgroundColor: AVATAR_COLORS.find((color) => color.value === avatarColor)?.hex || '#6B7280',
          }}
        >
          {`${firstName.charAt(0)}${surname.charAt(0)}`.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {firstName} {surname}
        </p>
        <p className="truncate text-xs text-foreground-muted">{username}</p>
      </div>
    </>
  );

  return (
    <div className={cn('flex items-center justify-between rounded-md border border-border px-3 py-2', className)}>
      {onSelect ? (
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          onClick={onSelect}
          disabled={disabled}
        >
          {identityContent}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{identityContent}</div>
      )}

      {action}
    </div>
  );
}
