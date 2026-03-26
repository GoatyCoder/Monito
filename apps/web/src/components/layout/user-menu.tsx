import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { User, Settings, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AVATAR_COLORS } from '@monito/types';
import { useAuth } from '@/contexts/auth-context';

interface UserMenuProps {
  username: string;
  avatarColor?: string;
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getColorClass = (color?: string): string => {
  if (!color) return '#6B7280';
  const normalized = color.toLowerCase();
  const found = AVATAR_COLORS.find((c) => c.value === normalized);
  return found?.hex || '#6B7280';
};

export function UserMenu({ username, avatarColor }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full hover:bg-secondary"
          aria-label={`Menu utente: ${username}`}
        >
            <Avatar className="h-10 w-10">
            <AvatarFallback className="text-white" style={{ backgroundColor: getColorClass(avatarColor) }}>
              {getInitials(username)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{username}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate({ to: '/profile' })}>
          <User className="mr-2 h-4 w-4" />
          Profilo
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate({ to: '/settings' })}>
          <Settings className="mr-2 h-4 w-4" />
          Impostazioni
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Esci
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
