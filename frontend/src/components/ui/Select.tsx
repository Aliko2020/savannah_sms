import { useId, type ReactNode } from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown, Info } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { Tooltip } from './Tooltip';

const triggerVariants = cva(
  [
    'inline-flex w-full items-center justify-between gap-2 rounded-lg bg-white px-3 text-left text-zinc-900',
    'ring-1 ring-inset ring-border',
    'transition-shadow duration-[var(--duration-fast)] ease-[var(--ease-out-quart)]',
    'data-[placeholder]:text-zinc-400',
    'focus:outline-none focus-visible:ring-[1.5px] focus-visible:ring-primary-500 focus-visible:shadow-[var(--shadow-focus-primary)]',
    'disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400',
    'dark:bg-surface-raised-dark dark:text-zinc-100 dark:ring-border-dark',
  ],
  {
    variants: {
      fieldSize: {
        sm: 'h-9 text-[13px]',
        md: 'h-10 text-sm',
        lg: 'h-11 text-[15px]',
      },
      invalid: {
        true: 'ring-danger-500 focus-visible:ring-danger-500 focus-visible:shadow-[var(--shadow-focus-danger)]',
        false: '',
      },
    },
    defaultVariants: { fieldSize: 'md', invalid: false },
  },
);

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
  /** Options sharing a group render under a heading, in order of first appearance. */
  group?: string;
}

export interface SelectProps extends VariantProps<typeof triggerVariants> {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  hint?: string;
  /** Hover explanation shown as an info icon next to the label — e.g. why
   * this field has no/limited options. Defaults to `hint`'s text when
   * `hint` is set and this is omitted, so most callers get it for free. */
  tooltip?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  className?: string;
  containerClassName?: string;
}

const itemClassName = cn(
  'relative flex h-9 cursor-pointer select-none items-center rounded-md pl-8 pr-3 text-sm text-zinc-800 outline-none',
  'data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-900',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
  'dark:text-zinc-200 dark:data-[highlighted]:bg-zinc-800 dark:data-[highlighted]:text-white',
);

function SelectItem({ opt }: { opt: SelectOption }) {
  return (
    <RadixSelect.Item value={opt.value} disabled={opt.disabled} className={itemClassName}>
      <RadixSelect.ItemIndicator className="absolute left-2.5 inline-flex items-center">
        <Check className="size-3.5 text-primary-600" strokeWidth={2.5} />
      </RadixSelect.ItemIndicator>
      <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
    </RadixSelect.Item>
  );
}

function renderOptions(options: SelectOption[]) {
  if (!options.some((o) => o.group)) {
    return options.map((opt) => <SelectItem key={opt.value} opt={opt} />);
  }

  const groups: { name: string | undefined; items: SelectOption[] }[] = [];
  for (const opt of options) {
    const last = groups[groups.length - 1];
    if (last && last.name === opt.group) {
      last.items.push(opt);
    } else {
      groups.push({ name: opt.group, items: [opt] });
    }
  }

  return groups.map((g, i) =>
    g.name ? (
      <RadixSelect.Group key={`${g.name}-${i}`}>
        <RadixSelect.Label className="px-2.5 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          {g.name}
        </RadixSelect.Label>
        {g.items.map((opt) => (
          <SelectItem key={opt.value} opt={opt} />
        ))}
      </RadixSelect.Group>
    ) : (
      g.items.map((opt) => <SelectItem key={opt.value} opt={opt} />)
    ),
  );
}

export function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Select…',
  label,
  hint,
  tooltip,
  error,
  disabled,
  required,
  name,
  fieldSize,
  className,
  containerClassName,
}: SelectProps) {
  const generatedId = useId();
  const hintId = `${generatedId}-hint`;
  const tooltipText = tooltip ?? hint;

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {(label || tooltipText) && (
        <div className="flex items-center gap-1.5">
          {label && (
            <label htmlFor={generatedId} className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
              {label}
              {required && <span className="ml-0.5 text-danger-600">*</span>}
            </label>
          )}
          {tooltipText && (
            <Tooltip content={tooltipText}>
              <Info className="size-3.5 shrink-0 cursor-default text-zinc-400" aria-hidden />
            </Tooltip>
          )}
        </div>
      )}

      <RadixSelect.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange} disabled={disabled} name={name} required={required}>
        <RadixSelect.Trigger
          id={generatedId}
          aria-invalid={!!error || undefined}
          aria-describedby={hint || error ? hintId : undefined}
          className={cn(triggerVariants({ fieldSize, invalid: !!error }), className)}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <ChevronDown className="size-4 text-zinc-400" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={6}
            className={cn(
              'z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg',
              'bg-white shadow-lg ring-1 ring-border',
              'data-[state=open]:animate-content-in',
              'dark:bg-surface-raised-dark dark:ring-border-dark',
            )}
          >
            <RadixSelect.Viewport className="p-1">
              {renderOptions(options)}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>

      {(hint || error) && (
        <p id={hintId} className={cn('text-xs', error ? 'text-danger-600' : 'text-zinc-500 dark:text-zinc-400')}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
