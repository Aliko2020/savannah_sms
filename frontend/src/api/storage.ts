import type { AuthUser } from '../types';

const TOKEN_KEY = 'savannasms_token';
const USER_KEY = 'savannasms_user';

// Session persists in localStorage (survives browser restart) when "remember me"
// is checked, otherwise sessionStorage (cleared when the tab closes).
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function persistSession(token: string, user: AuthUser, remember: boolean): void {
  const target = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;

  target.setItem(TOKEN_KEY, token);
  target.setItem(USER_KEY, JSON.stringify(user));
  other.removeItem(TOKEN_KEY);
  other.removeItem(USER_KEY);
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}
