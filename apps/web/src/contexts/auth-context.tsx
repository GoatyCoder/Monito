import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import type { User, LoginRequest, LoginResponse, UserPreferences } from '@monito/types';

const DEFAULT_PREFERENCES: UserPreferences = {
  masterDataPageSize: 20,
  auditLogPageSize: 20,
};

function normalizeAvatarColor(value?: string): User['avatarColor'] | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (
    normalized === 'blue' ||
    normalized === 'green' ||
    normalized === 'violet' ||
    normalized === 'orange' ||
    normalized === 'red' ||
    normalized === 'pink' ||
    normalized === 'gray'
  ) {
    return normalized;
  }
  return undefined;
}

function normalizeUser(user: User): User {
  return {
    ...user,
    avatarColor: normalizeAvatarColor(user.avatarColor),
  };
}

interface AuthContextType {
  user: User | null;
  preferences: UserPreferences;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<User>;
  logout: () => void;
  refreshCurrentUser: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      Promise.all([
        api.get<{ data: User }>('/users/me'),
        api.get<{ data: UserPreferences }>('/users/me/preferences'),
      ])
        .then(([userRes, prefsRes]) => {
          setUser(normalizeUser(userRes.data.data));
          setPreferences(prefsRes.data.data);
        })
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setPreferences(DEFAULT_PREFERENCES);
        })
        .finally(() => setIsLoading(false));
    } else {
      setPreferences(DEFAULT_PREFERENCES);
      setIsLoading(false);
    }
  }, []);

  const login = async (data: LoginRequest) => {
    const response = await api.post<{ data: LoginResponse }>('/auth/login', data);
    const { accessToken, refreshToken, user: userData } = response.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    const normalizedUser = normalizeUser(userData);
    setUser(normalizedUser);

    try {
      const prefs = await api.get<{ data: UserPreferences }>('/users/me/preferences');
      setPreferences(prefs.data.data);
    } catch {
      setPreferences(DEFAULT_PREFERENCES);
    }

    return normalizedUser;
  };

  const refreshCurrentUser = async () => {
    const response = await api.get<{ data: User }>('/users/me');
    setUser(normalizeUser(response.data.data));
  };

  const refreshPreferences = async () => {
    const response = await api.get<{ data: UserPreferences }>('/users/me/preferences');
    setPreferences(response.data.data);
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setPreferences(DEFAULT_PREFERENCES);
  };

  return (
    <AuthContext.Provider
      value={{ user, preferences, isLoading, login, logout, refreshCurrentUser, refreshPreferences }}
    >
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
