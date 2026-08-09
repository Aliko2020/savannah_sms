import type { ReactNode, SVGProps } from 'react';

interface StatCardProps {
  icon: (props: SVGProps<SVGSVGElement>) => React.JSX.Element;
  value: ReactNode;
  label: string;
  colorKey: keyof typeof COLOR_CLASSES;
  subtext?: ReactNode;
  onClick?: () => void;
}

// Tailwind can only discover classes that appear as literal strings in source,
// so each badge/icon pair must be spelled out — no `bg-${colorKey}/10` templates.
const COLOR_CLASSES = {
  'stat-population': { bg: 'bg-stat-population/10', text: 'text-stat-population' },
  'stat-staff': { bg: 'bg-stat-staff/10', text: 'text-stat-staff' },
  'stat-fees': { bg: 'bg-stat-fees/10', text: 'text-stat-fees' },
  'stat-enrollment': { bg: 'bg-stat-enrollment/10', text: 'text-stat-enrollment' },
  'stat-classrooms': { bg: 'bg-stat-classrooms/10', text: 'text-stat-classrooms' },
} as const;

export function StatCard({ icon: Icon, value, label, colorKey, subtext, onClick }: StatCardProps) {
  const colors = COLOR_CLASSES[colorKey];
  const className = `w-full rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition ${
    onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : ''
  }`;

  const content = (
    <>
      <div className="flex items-center gap-3.5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
          <Icon className={`h-5 w-5 ${colors.text}`} />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold leading-tight text-slate-900">{value}</p>
          <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        </div>
      </div>
      {subtext && (
        <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">{subtext}</p>
      )}
    </>
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
