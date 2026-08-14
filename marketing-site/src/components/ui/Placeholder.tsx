import { Wrench } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * Marks copy that is not real yet — a number, quote, or policy that needs to
 * be confirmed before this page ships. Nothing wrapped here should ever be
 * mistaken for a real stat: it renders visibly as a placeholder, not as fact.
 */
export function Placeholder({ children, className }: { children: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-dashed border-paper-dim/50 bg-paper/5 px-2 py-0.5 text-[0.9em] italic text-paper-dim',
        className,
      )}
      title="Placeholder — confirm before launch"
    >
      <Wrench className="size-3 shrink-0" aria-hidden />
      {children}
    </span>
  );
}
