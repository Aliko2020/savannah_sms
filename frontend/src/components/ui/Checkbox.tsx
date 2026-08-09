import { forwardRef, useId, type ReactNode } from 'react';
import * as RadixCheckbox from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface CheckboxProps extends RadixCheckbox.CheckboxProps {
  label?: ReactNode;
  description?: string;
  containerClassName?: string;
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, containerClassName, label, description, id, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;

    const box = (
      <RadixCheckbox.Root
        ref={ref}
        id={checkboxId}
        className={cn(
          'peer flex size-[18px] shrink-0 items-center justify-center rounded-[5px]',
          'ring-1 ring-inset ring-border-strong bg-white',
          'transition-colors duration-[var(--duration-fast)]',
          'hover:ring-primary-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          'data-[state=checked]:bg-primary-900 data-[state=checked]:ring-primary-900',
          'data-[state=indeterminate]:bg-primary-900 data-[state=indeterminate]:ring-primary-900',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:bg-surface-raised-dark dark:ring-border-dark',
          className,
        )}
        {...props}
      >
        <RadixCheckbox.Indicator className="text-white">
          {props.checked === 'indeterminate' ? <Minus className="size-3" strokeWidth={3} /> : <Check className="size-3" strokeWidth={3} />}
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
    );

    if (!label && !description) return box;

    return (
      <div className={cn('flex items-start gap-2.5', containerClassName)}>
        {box}
        <div className="grid gap-0.5 leading-none">
          {label && (
            <label
              htmlFor={checkboxId}
              className="cursor-pointer text-sm font-medium text-zinc-800 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 dark:text-zinc-200"
            >
              {label}
            </label>
          )}
          {description && <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>}
        </div>
      </div>
    );
  },
);
Checkbox.displayName = 'Checkbox';
