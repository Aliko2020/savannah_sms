import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { EyeIcon, EyeOffIcon, LockIcon, UserIcon } from '../components/icons';
import type { Role } from '../types';

type Portal = 'ADMIN' | 'TEACHER' | 'STUDENT';

const PORTAL_ROLES: Record<Portal, Role[]> = {
  ADMIN: ['ADMIN', 'SUPER_ADMIN',],
  TEACHER: ['TEACHER'],
  STUDENT: ['STUDENT'],
};

const PORTAL_LABEL: Record<Portal, string> = {
  ADMIN: 'Admin',
  TEACHER: 'Teacher',
  STUDENT: 'Student'
};

export function LoginPage() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [portal, setPortal] = useState<Portal>('ADMIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const user = await login(username, password, remember);

      if (!PORTAL_ROLES[portal].includes(user.role)) {
        logout();
        setError(`This account isn't a ${PORTAL_LABEL[portal]} account.`);
        return;
      }

      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-brand md:block" />

      <div className="flex w-full items-center justify-center bg-white px-6 py-16 md:w-1/2">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <h1 className="mb-4 text-xl font-semibold text-slate-900">Logging in as</h1>

          <div className="mb-6 flex items-center gap-6">
            {(Object.keys(PORTAL_LABEL) as Portal[]).map((p) => (
              <label key={p} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={portal === p}
                  onChange={() => setPortal(p)}
                  className="h-4 w-4 rounded border-slate-300 text-red-500 focus:ring-red-500"
                />
                <span className={portal === p ? 'font-medium text-red-500' : 'text-slate-900'}>
                  {PORTAL_LABEL[p]}
                </span>
              </label>
            ))}
          </div>

          <label className="mb-1 block text-sm font-medium text-slate-900" htmlFor="username">
            Username <span className="text-red-500">*</span>
          </label>
          <div className="relative mb-4">
            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="username"
              className="w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              placeholder="Phone or admission number"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <label className="mb-1 block text-sm font-medium text-slate-900" htmlFor="password">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative mb-4">
            <LockIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="w-full rounded-lg border py-2.5 pl-9 pr-9 text-sm placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>

          <div className="mb-6 flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-slate-700">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="font-medium text-red-500 hover:underline">
              Forgot password?
            </Link>
          </div>

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
