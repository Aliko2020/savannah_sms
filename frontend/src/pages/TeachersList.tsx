import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AppLayout } from '../components/AppLayout';
import { PageHeader } from '../components/PageHeader';
import { apiFetch, ApiError } from '../api/client';
import { UsersIcon } from '../components/icons';
import { formatName } from '../utils/format';
import { DEPARTMENTS, DEPARTMENT_LABELS, EMPLOYMENT_STATUS_LABELS } from '../constants';
import type { Teacher } from '../types';

function departmentSortIndex(t: Teacher): number {
  return t.department ? DEPARTMENTS.indexOf(t.department) : DEPARTMENTS.length;
}

export function TeachersListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: teachers, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => apiFetch<Teacher[]>('/teachers'),
  });

  const deleteTeacher = useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/teachers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Teacher removed.');
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not remove teacher.');
    },
  });

  function handleRemove(t: Teacher) {
    const fullName = formatName(t.firstName, t.lastName);
    if (window.confirm(`Remove ${fullName}? This will permanently delete their account.`)) {
      deleteTeacher.mutate(t.id);
    }
  }

  const sortedTeachers = teachers
    ? [...teachers].sort((a, b) => departmentSortIndex(a) - departmentSortIndex(b))
    : undefined;

  return (
    <AppLayout>
      <PageHeader title="Teachers" icon={UsersIcon} />

      <div className="overflow-hidden rounded-lg bg-white shadow">
        {isLoading && <p className="px-6 py-8 text-center text-sm text-slate-500">Loading…</p>}

        {!isLoading && sortedTeachers && sortedTeachers.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-slate-500">No teachers yet.</p>
        )}

        {!isLoading && sortedTeachers && sortedTeachers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-6 py-3 font-semibold">#</th>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Department</th>
                  <th className="px-6 py-3 font-semibold">Employment Status</th>
                  <th className="px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedTeachers.map((t, index) => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/teachers/${t.id}`)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-6 py-3 text-slate-400">{index + 1}</td>
                    <td className="px-6 py-3 font-medium text-slate-900">{formatName(t.firstName, t.lastName)}</td>
                    <td className="px-6 py-3 text-slate-500">
                      {t.department ? DEPARTMENT_LABELS[t.department] : 'No department'}
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {t.employmentStatus ? EMPLOYMENT_STATUS_LABELS[t.employmentStatus] : '—'}
                    </td>
                    <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-3">
                        <button
                          onClick={() => navigate(`/teachers/${t.id}?edit=1`)}
                          className="text-sm font-medium text-brand hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemove(t)}
                          disabled={deleteTeacher.isPending}
                          className="text-sm font-bold text-red-500 hover:underline disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
