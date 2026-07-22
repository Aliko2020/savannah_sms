import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { apiFetch } from '../api/client';
import { clearSession, getStoredUser, getToken, persistSession } from '../api/storage';
import type { AuthUser, LoginResponse } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string, remember: boolean) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => (getToken() ? getStoredUser() : null));

  const login = useCallback(async (username: string, password: string, remember: boolean) => {
    const data = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    persistSession(data.token, data.user, remember);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
