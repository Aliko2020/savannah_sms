import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/cn';
import type { NavLink as NavLinkItem } from '../../data/nav';

export function NavDropdown({ label, items }: { label: string; items: NavLinkItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'flex items-center gap-1 text-sm font-medium transition-colors',
          open ? 'text-accent' : 'text-paper-muted hover:text-paper',
        )}
      >
        {label}
        <ChevronDown className={cn('size-3.5 transition-transform duration-200', open && 'rotate-180')} aria-hidden />
      </button>

      <div
        className={cn(
          'absolute left-1/2 top-full z-50 mt-3 w-80 -translate-x-1/2 rounded-2xl border border-paper/10 bg-ink-raised p-2 shadow-2xl shadow-paper/10 transition-all duration-150 ease-out',
          open ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0',
        )}
      >
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className="group flex items-start gap-3.5 rounded-xl px-3 py-3 transition-colors hover:bg-accent/10"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
              <item.icon className="size-4" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-medium text-paper">{item.label}</span>
              {item.sub && <span className="block text-xs text-paper-dim">{item.sub}</span>}
            </span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
