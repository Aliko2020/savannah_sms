import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

const fieldVariants = cva(
  [
    'w-full rounded-lg bg-white text-zinc-900 placeholder:text-zinc-400',
    'ring-1 ring-inset ring-border',
    'transition-shadow duration-[var(--duration-fast)] ease-[var(--ease-out-quart)]',
    'focus:outline-none focus:ring-[1.5px] focus:ring-primary-500 focus:shadow-[var(--shadow-focus-primary)]',
    'disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400',
    'dark:bg-surface-raised-dark dark:text-zinc-100 dark:ring-border-dark dark:placeholder:text-zinc-600',
  ],
  {
    variants: {
      fieldSize: {
        sm: 'h-9 text-[13px]',
        md: 'h-10 text-sm',
        lg: 'h-11 text-[15px]',
      },
      invalid: {
        true: 'ring-danger-500 focus:ring-danger-500 focus:shadow-[var(--shadow-focus-danger)]',
        false: '',
      },
      hasLeftIcon: { true: '', false: '' },
      hasRightIcon: { true: '', false: '' },
    },
    compoundVariants: [
      { hasLeftIcon: true, fieldSize: 'sm', className: 'pl-8' },
      { hasLeftIcon: true, fieldSize: 'md', className: 'pl-9' },
      { hasLeftIcon: true, fieldSize: 'lg', className: 'pl-10' },
      { hasLeftIcon: false, className: 'pl-3' },
      { hasRightIcon: true, className: 'pr-9' },
      { hasRightIcon: false, className: 'pr-3' },
    ],
    defaultVariants: {
      fieldSize: 'md',
      invalid: false,
    },
  },
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof fieldVariants> {
  /** Caption above the field. Deliberately static, not floating — reads
   *  cleanly at a glance and never overlaps a long value the way an
   *  animated floating label can. */
  label?: ReactNode;
  /** Muted helper text shown below the field when there's no error. */
  hint?: string;
  /** Validation message — replaces `hint`, tints the ring red, adds an icon. */
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      fieldSize,
      label,
      hint,
      error,
      leftIcon,
      rightIcon,
      id,
      required,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = `${inputId}-hint`;

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
            {label}
            {required && <span className="ml-0.5 text-danger-600">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 [&_svg]:size-4">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={!!error || undefined}
            aria-describedby={hint || error ? hintId : undefined}
            className={cn(
              fieldVariants({
                fieldSize,
                invalid: !!error,
                hasLeftIcon: !!leftIcon,
                hasRightIcon: !!rightIcon || !!error,
              }),
              className,
            )}
            {...props}
          />

          {(rightIcon || error) && (
            <span
              className={cn(
                'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 [&_svg]:size-4',
                error ? 'text-danger-500' : 'text-zinc-400',
              )}
            >
              {error ? <AlertCircle /> : rightIcon}
            </span>
          )}
        </div>

        {(hint || error) && (
          <p id={hintId} className={cn('text-xs', error ? 'text-danger-600' : 'text-zinc-500 dark:text-zinc-400')}>
            {error || hint}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
