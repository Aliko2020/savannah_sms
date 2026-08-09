import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Tooltip } from './Tooltip';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'rounded-lg text-sm font-medium',
    'transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-quart)]',
    'disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:outline-none focus-visible:ring-[3.5px]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-primary-900 text-white shadow-xs',
          'hover:bg-primary-800',
          'active:bg-primary-900',
          'focus-visible:ring-primary-200',
        ],
        secondary: [
          'bg-white text-zinc-900 shadow-xs ring-1 ring-inset ring-border',
          'hover:bg-zinc-50 hover:ring-border-strong',
          'active:bg-zinc-100',
          'focus-visible:ring-primary-100',
          'dark:bg-surface-raised-dark dark:text-zinc-100 dark:ring-border-dark dark:hover:bg-zinc-800',
        ],
        ghost: [
          'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
          'active:bg-zinc-200',
          'focus-visible:ring-primary-100',
          'dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
        ],
        danger: [
          'bg-danger-600 text-white shadow-xs',
          'hover:bg-danger-700',
          'active:bg-danger-700',
          'focus-visible:ring-danger-50',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-[13px] [&_svg]:size-3.5',
        md: 'h-10 px-4 [&_svg]:size-4',
        lg: 'h-11 px-5 text-[15px] [&_svg]:size-4.5',
        icon: 'size-10 p-0 [&_svg]:size-4',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as the child element (e.g. a react-router `Link`) instead of a `<button>`. */
  asChild?: boolean;
  /** Shows a spinner in place of the leading icon and disables the button. */
  loading?: boolean;
  /** Explains why the button is disabled, as a hover tooltip. When set
   * alongside `disabled`, the native `disabled` attribute is swapped for
   * `aria-disabled` + a swallowed click — a truly `disabled` element never
   * fires hover/focus events, so the tooltip would otherwise be unreachable. */
  disabledReason?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, disabledReason, onClick, children, ...props }, ref) => {
    // Radix's Slot requires exactly one child element to clone props onto —
    // it can't also carry the loading-spinner sibling, so asChild renders
    // straight through with nothing else injected around `children`.
    if (asChild) {
      return (
        <Slot ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props}>
          {children}
        </Slot>
      );
    }

    const softDisabled = !!disabled && !loading && !!disabledReason;

    const button = (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }), softDisabled && 'cursor-not-allowed opacity-50')}
        disabled={softDisabled ? undefined : disabled || loading}
        aria-disabled={softDisabled || undefined}
        aria-busy={loading || undefined}
        onClick={softDisabled ? (e) => e.preventDefault() : onClick}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" aria-hidden />}
        {children}
      </button>
    );

    return softDisabled ? <Tooltip content={disabledReason}>{button}</Tooltip> : button;
  },
);
Button.displayName = 'Button';
