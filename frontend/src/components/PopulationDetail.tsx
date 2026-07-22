import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client';
import { CLASS_CATEGORIES, CLASS_CATEGORY_LABELS } from '../constants';
import { titleCase } from '../utils/format';
import type { AcademicYear, ClassItem } from '../types';

export function PopulationDetail() {
  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => apiFetch<AcademicYear[]>('/academic-years'),
  });
  const currentYear = academicYears?.find((y) => y.isCurrent) ?? academicYears?.[0];

  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes', currentYear?.id],
    queryFn: () => apiFetch<ClassItem[]>(`/classes?academicYearId=${currentYear!.id}`),
    enabled: !!currentYear,
  });

  const total = classes?.reduce((sum, c) => sum + c.studentCount, 0) ?? 0;

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  if (!classes || classes.length === 0) {
    return <p className="text-sm text-slate-500">No classes set up yet.</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {CLASS_CATEGORIES.map((category) => {
        const inCategory = classes.filter((c) => c.category === category);
        if (inCategory.length === 0) return null;
        return (
          <div key={category}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {CLASS_CATEGORY_LABELS[category]}
            </p>
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-slate-100">
                {inCategory.map((c, index) => (
                  <tr key={c.id}>
                    <td className="py-2 pr-2 text-slate-400">{index + 1}</td>
                    <td className="py-2 text-slate-900">{titleCase(c.name)}</td>
                    <td className="py-2 text-right text-slate-500">{c.studentCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
      <div className="col-span-full flex items-center justify-between border-t border-slate-200 pt-3 text-sm font-semibold text-slate-900">
        <span>Total</span>
        <span>{total} students</span>
      </div>
    </div>
  );
}
