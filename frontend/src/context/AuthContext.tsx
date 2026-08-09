import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { apiFetch } from '../api/client';
import { clearSession, getStoredUser, getToken, persistSession } from '../api/storage';
import type { AuthUser, LoginOtpRequiredResponse, LoginResponse } from '../types';

export type LoginResult = { requiresOtp: true; username: string } | { requiresOtp: false; user: AuthUser };

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string, remember: boolean) => Promise<LoginResult>;
  verifyLoginOtp: (username: string, code: string, remember: boolean) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => (getToken() ? getStoredUser() : null));

  const login = useCallback(async (username: string, password: string, remember: boolean): Promise<LoginResult> => {
    const data = await apiFetch<LoginResponse | LoginOtpRequiredResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (!('token' in data)) {
      return { requiresOtp: true, username: data.username };
    }
    persistSession(data.token, data.user, remember);
    setUser(data.user);
    return { requiresOtp: false, user: data.user };
  }, []);

  const verifyLoginOtp = useCallback(async (username: string, code: string, remember: boolean): Promise<AuthUser> => {
    const data = await apiFetch<LoginResponse>('/auth/verify-login-otp', {
      method: 'POST',
      body: JSON.stringify({ username, code }),
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
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, verifyLoginOtp, logout }}>
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
