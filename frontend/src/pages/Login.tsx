import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Quote, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Checkbox } from '../components/ui/Checkbox';
import { cn } from '../lib/cn';
import type { Role } from '../types';

// "Parent" is a UI label only — it's a school for young children, so in
// practice a parent is the one typing in the login, using the credentials
// issued for their child's STUDENT account. There is no separate parent
// role or account on the backend.
type Portal = 'ADMIN' | 'TEACHER' | 'STUDENT';

const PORTAL_ROLES: Record<Portal, Role[]> = {
  ADMIN: ['ADMIN', 'SUPER_ADMIN'],
  TEACHER: ['TEACHER'],
  STUDENT: ['STUDENT'],
};

const PORTAL_LABEL: Record<Portal, string> = {
  ADMIN: 'Admin',
  TEACHER: 'Teacher',
  STUDENT: 'Parent',
};

const PORTALS: Portal[] = ['ADMIN', 'TEACHER', 'STUDENT'];

function BrandMark() {
  return (
    <div className="mb-8 flex items-center gap-2 md:hidden">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-900 text-sm font-bold text-white">
        S
      </div>
      <span className="text-base font-semibold text-zinc-900">SavannaSMS</span>
    </div>
  );
}

export function LoginPage() {
  const { login, verifyLoginOtp, logout } = useAuth();
  const navigate = useNavigate();
  const [portal, setPortal] = useState<Portal>('ADMIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Admin/Super Admin logins are two-step: password first, then a code sent
  // to their phone. awaitingOtp switches the form into that second step.
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  function finishLogin(user: { role: Role }) {
    if (!PORTAL_ROLES[portal].includes(user.role)) {
      logout();
      setError(`This account isn't a ${PORTAL_LABEL[portal]} account.`);
      return;
    }
    navigate('/');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await login(username, password, remember);
      if (result.requiresOtp) {
        setAwaitingOtp(true);
        return;
      }
      finishLogin(result.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const user = await verifyLoginOtp(username, otpCode, remember);
      finishLogin(user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendOtp() {
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password, remember);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  function backToPassword() {
    setAwaitingOtp(false);
    setOtpCode('');
    setError(null);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 sm:p-8">
      <div className="w-full max-w-5xl">
        <div className="flex overflow-hidden rounded-2xl bg-white shadow-lg sm:rounded-3xl">
          {/* ---- Hero panel ---- */}
          <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary-900 p-10 md:flex">
            <div
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 15% 15%, rgba(255,255,255,0.10), transparent 40%), radial-gradient(circle at 85% 75%, rgba(255,255,255,0.08), transparent 45%)',
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.15]"
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)',
                backgroundSize: '18px 18px',
              }}
            />

            <div className="relative inline-flex w-fit items-center gap-2 rounded-full bg-white/10 py-1.5 pl-1.5 pr-4 backdrop-blur-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-primary-900">
                S
              </div>
              <span className="text-sm font-semibold text-white">EduSavannah</span>
            </div>

            <div className="relative">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                <Quote className="size-5 text-white" fill="currentColor" strokeWidth={0} />
              </div>
              <h2 className="max-w-sm text-2xl font-semibold leading-snug text-white text-balance">
                Run your school, all in one place.
              </h2>
              <p className="mt-3 max-w-sm text-sm text-white/60 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                Enrollment, classes, assessments, fee collection and staff — one system for admins, teachers, and
                parents.
              </p>
            </div>
          </div>

          {/* ---- Form panel ---- */}
          <div className="flex w-full items-center justify-center px-6 py-12 sm:px-12 sm:py-16 md:w-1/2">
            {!awaitingOtp ? (
              <form onSubmit={handleSubmit} className="w-full max-w-sm">
                <BrandMark />

                <h1 className="mb-1 text-2xl font-semibold tracking-tight text-zinc-900">Welcome back</h1>
                <p className="mb-6 text-sm text-zinc-500">Sign in to continue to SavannaSMS.</p>

                <div className="mb-6 grid grid-cols-3 gap-1 rounded-lg bg-zinc-100 p-1">
                  {PORTALS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPortal(p)}
                      className={cn(
                        'rounded-md py-1.5 text-sm font-medium transition-colors',
                        portal === p ? 'bg-white text-primary-800 shadow-xs' : 'text-zinc-500 hover:text-zinc-700',
                      )}
                    >
                      {PORTAL_LABEL[p]}
                    </button>
                  ))}
                </div>

                <div className="mb-4">
                  <Input
                    id="username"
                    label="Username"
                    leftIcon={<User />}
                    placeholder="Phone or admission number"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-1.5 block text-[13px] font-medium text-zinc-700" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 [&_svg]:size-4">
                      <Lock />
                    </span>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="h-10 w-full rounded-lg bg-white pl-9 pr-10 text-sm text-zinc-900 ring-1 ring-inset ring-border transition-shadow placeholder:text-zinc-400 focus:outline-none focus:ring-[1.5px] focus:ring-primary-500 focus:shadow-[var(--shadow-focus-primary)]"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 [&_svg]:size-4"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>

                <div className="mb-6 flex items-center justify-between text-sm">
                  <Checkbox checked={remember} onCheckedChange={(checked) => setRemember(checked === true)} label="Remember me" />
                  <Link to="/forgot-password" className="font-medium text-primary-700 hover:underline">
                    Forgot password?
                  </Link>
                </div>

                {error && (
                  <p className="mb-4 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>
                )}

                <Button type="submit" loading={submitting} size="lg" className="w-full">
                  Sign In
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="w-full max-w-sm">
                <BrandMark />

                <h1 className="mb-1 text-2xl font-semibold tracking-tight text-zinc-900">Enter verification code</h1>
                <p className="mb-6 text-sm text-zinc-500">
                  We sent a 6-digit code by SMS to the phone number on file for <strong>{username}</strong>.
                </p>

                <div className="mb-4">
                  <Input
                    id="otp"
                    label="Verification code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    leftIcon={<Lock />}
                    className="tracking-widest"
                    placeholder="6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    autoComplete="one-time-code"
                    autoFocus
                    required
                  />
                </div>

                <div className="mb-6 flex items-center justify-between text-sm">
                  <button type="button" onClick={backToPassword} className="font-medium text-zinc-500 hover:underline">
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={submitting}
                    className="font-medium text-primary-700 hover:underline disabled:opacity-50"
                  >
                    Resend code
                  </button>
                </div>

                {error && (
                  <p className="mb-4 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>
                )}

                <Button type="submit" loading={submitting} disabled={otpCode.length !== 6} size="lg" className="w-full">
                  Verify &amp; Login
                </Button>
              </form>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/60">
          © {new Date().getFullYear()} SavannaSMS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
