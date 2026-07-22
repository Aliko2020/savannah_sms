import { Link } from 'react-router-dom';

export function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 text-center shadow">
        <h1 className="mb-3 text-xl font-semibold text-slate-900">Forgot your password?</h1>
        <p className="mb-6 text-sm text-slate-600">
          Self-service password reset isn't available yet. Contact your school administrator to have your
          password reset.
        </p>
        <Link to="/login" className="text-sm font-medium text-red-500 hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
