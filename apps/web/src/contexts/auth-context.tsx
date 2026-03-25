import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { showSuccess, showError } from '@/lib/toast';
import type { User, LoginRequest, LoginResponse, AvatarColor } from '@monito/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  updateAvatarColor: (color: AvatarColor) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.get<{ data: User }>('/users/me')
        .then((res) => setUser(res.data.data))
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        })
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

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const updateAvatarColor = async (color: AvatarColor) => {
    try {
      const response = await api.patch<{ data: User }>('/users/me/avatar-color', { avatarColor: color });
      setUser(response.data.data);
      showSuccess('Colore avatar aggiornato');
    } catch {
      showError('Errore durante l\'aggiornamento del colore avatar');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateAvatarColor }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
