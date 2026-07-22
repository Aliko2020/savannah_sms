import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client';
import { formatName } from '../utils/format';
import type { StaffUser, Teacher } from '../types';

export function StaffDetail() {
  const { data: teachers, isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => apiFetch<Teacher[]>('/teachers'),
  });

  const { data: nonTeaching, isLoading: loadingNonTeaching } = useQuery({
    queryKey: ['users', 'ADMIN,SUPER_ADMIN'],
    queryFn: () => apiFetch<StaffUser[]>('/users?role=ADMIN,SUPER_ADMIN'),
  });

  if (loadingTeachers || loadingNonTeaching) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  const total = (teachers?.length ?? 0) + (nonTeaching?.length ?? 0);

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Teaching</p>
        {teachers && teachers.length > 0 ? (
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-slate-100">
              {teachers.map((t, index) => (
                <tr key={t.id}>
                  <td className="py-2 pr-2 text-slate-400">{index + 1}</td>
                  <td className="py-2 text-slate-900">{formatName(t.firstName, t.lastName)}</td>
                  <td className="py-2 text-right text-slate-500">{t.employeeId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-slate-500">No teachers yet.</p>
        )}
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Non-Teaching</p>
        {nonTeaching && nonTeaching.length > 0 ? (
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-slate-100">
              {nonTeaching.map((u, index) => (
                <tr key={u.id}>
                  <td className="py-2 pr-2 text-slate-400">{index + 1}</td>
                  <td className="py-2 text-slate-900">{formatName(u.firstName, u.lastName)}</td>
                  <td className="py-2 text-right text-slate-500">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-slate-500">No non-teaching staff yet.</p>
        )}
      </div>

      <div className="col-span-full flex items-center justify-between border-t border-slate-200 pt-3 text-sm font-semibold text-slate-900">
        <span>Total</span>
        <span>{total} staff</span>
      </div>
    </div>
  );
}
