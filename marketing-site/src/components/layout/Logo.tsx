import { Link } from 'react-router-dom';

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <img src="/brand/edusavannah-mark-dark.png" alt="" className="h-8 w-8 shrink-0 rounded-md" />
      <span className="font-display text-xl font-bold tracking-tight text-paper">Edusavannah</span>
    </Link>
  );
}
