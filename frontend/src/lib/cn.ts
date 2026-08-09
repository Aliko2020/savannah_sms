import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combines conditional class logic (clsx) with Tailwind-aware de-duplication
// (twMerge) — lets a consumer override e.g. `px-4` from a variant with their
// own `px-6` without both ending up in the class list.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
