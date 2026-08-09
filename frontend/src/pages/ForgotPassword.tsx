import { Link } from 'react-router-dom';

export function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
        <h1 className="mb-3 text-xl font-semibold text-zinc-900">Forgot your password?</h1>
        <p className="mb-6 text-sm text-zinc-600">
          Self-service password reset isn't available yet. Contact your school administrator to have your
          password reset.
        </p>
        <Link to="/login" className="text-sm font-medium text-primary-700 hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
