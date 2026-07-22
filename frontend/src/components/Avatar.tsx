interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-20 w-20 text-xl',
};

export function Avatar({ name, size = 'md' }: AvatarProps) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?';

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand font-semibold text-white ${SIZE_CLASSES[size]}`}
    >
      {initials}
    </div>
  );
}
