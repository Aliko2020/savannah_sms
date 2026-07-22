import type { ReactNode, SVGProps } from 'react';

interface StatCardProps {
  icon: (props: SVGProps<SVGSVGElement>) => React.JSX.Element;
  value: number;
  label: string;
  colorClassName: string;
  subtext?: ReactNode;
  onClick?: () => void;
}

export function StatCard({ value, label, colorClassName, subtext, onClick }: StatCardProps) {
  const className = `flex w-full items-center gap-4 rounded-md px-6 py-6 text-left text-white ${colorClassName} ${
    onClick ? 'cursor-pointer transition hover:brightness-110' : ''
  }`;

  const content = (
    <div>
      <p className="text-2xl font-bold leading-tight">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-90">{label}</p>
      {subtext && <p className="mt-1 text-xs opacity-80">{subtext}</p>}
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}
