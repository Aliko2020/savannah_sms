import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Search, Users } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AddTeacherForm } from '../components/AddTeacherForm';
import { apiFetch, ApiError } from '../api/client';
import { formatName, titleCase } from '../utils/format';
import { DEPARTMENTS, DEPARTMENT_LABELS, EMPLOYMENT_STATUS_LABELS } from '../constants';
import type { Teacher } from '../types';

function departmentSortIndex(t: Teacher): number {
  return t.department ? DEPARTMENTS.indexOf(t.department) : DEPARTMENTS.length;
}

// Requires every word in the query to match at least one name field, so
// full-name searches like "Mike Adongo" work, not just single-field matches.
function matchesSearch(t: Teacher, query: string): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  const fields = [t.firstName, t.otherName, t.lastName].filter((f): f is string => !!f).map((f) => f.toLowerCase());
  return words.every((word) => fields.some((field) => field.includes(word)));
}

export function TeachersListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
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
    ? teachers.filter((t) => matchesSearch(t, search)).sort((a, b) => departmentSortIndex(a) - departmentSortIndex(b))
    : undefined;

  return (
    <DashboardLayout title="Teachers" icon={Users}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          containerClassName="max-w-xs flex-1"
          placeholder="Search by name…"
          leftIcon={<Search />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus /> Add Teacher
          </Button>
        )}
      </div>

      {showAddForm && <AddTeacherForm onDone={() => setShowAddForm(false)} />}

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        {isLoading && <p className="px-6 py-8 text-center text-sm text-zinc-500">Loading…</p>}

        {!isLoading && sortedTeachers && sortedTeachers.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-zinc-500">
            {search ? 'No teachers found.' : 'No teachers yet.'}
          </p>
        )}

        {!isLoading && sortedTeachers && sortedTeachers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-[11px] uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-6 py-3 font-semibold">#</th>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Department</th>
                  <th className="px-6 py-3 font-semibold">Assigned Class</th>
                  <th className="px-6 py-3 font-semibold">Employment Status</th>
                  <th className="px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedTeachers.map((t, index) => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/teachers/${t.id}`)}
                    className="cursor-pointer transition-colors hover:bg-zinc-50"
                  >
                    <td className="px-6 py-3 tabular-nums text-zinc-400">{index + 1}</td>
                    <td className="px-6 py-3 font-medium text-zinc-900">{formatName(t.firstName, t.lastName)}</td>
                    <td className="px-6 py-3 text-zinc-500">
                      {t.department ? DEPARTMENT_LABELS[t.department] : 'Not set'}
                    </td>
                    <td className="px-6 py-3 text-zinc-500">
                      {t.assignedClass ? titleCase(t.assignedClass.name) : 'Not assigned'}
                    </td>
                    <td className="px-6 py-3 text-zinc-500">
                      {t.employmentStatus ? EMPLOYMENT_STATUS_LABELS[t.employmentStatus] : 'Not set'}
                    </td>
                    <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/teachers/${t.id}?edit=1`)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                          onClick={() => handleRemove(t)}
                          disabled={deleteTeacher.isPending}
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
