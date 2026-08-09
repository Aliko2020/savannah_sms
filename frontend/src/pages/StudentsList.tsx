import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Plus, Search } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { AddStudentForm } from '../components/AddStudentForm';
import { apiFetch } from '../api/client';
import { formatName, titleCase } from '../utils/format';
import type { AcademicYear, ClassItem, StudentListItem } from '../types';

// Radix Select reserves the empty string for "no selection".
const ALL_CLASSES = '__all__';

export function StudentsListPage() {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => apiFetch<AcademicYear[]>('/academic-years'),
  });
  const currentYear = academicYears?.find((y) => y.isCurrent) ?? academicYears?.[0];

  const { data: classes } = useQuery({
    queryKey: ['classes', currentYear?.id],
    queryFn: () => apiFetch<ClassItem[]>(`/classes?academicYearId=${currentYear!.id}`),
    enabled: !!currentYear,
  });

  const [classId, setClassId] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data: students, isLoading } = useQuery({
    queryKey: ['students', classId, search],
    queryFn: () =>
      apiFetch<StudentListItem[]>(
        `/students?${classId ? `classId=${classId}&` : ''}${search ? `search=${encodeURIComponent(search)}` : ''}`,
      ),
  });

  return (
    <DashboardLayout title="Students" icon={GraduationCap}>
      {showAddForm ? (
        <AddStudentForm onDone={() => setShowAddForm(false)} />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="sm:w-56">
                <Select
                  value={classId || ALL_CLASSES}
                  onValueChange={(v) => setClassId(v === ALL_CLASSES ? '' : v)}
                  options={[
                    { value: ALL_CLASSES, label: 'All classes' },
                    ...(classes ?? []).map((c) => ({ value: c.id, label: titleCase(c.name) })),
                  ]}
                />
              </div>
              <Input
                containerClassName="flex-1 sm:max-w-xs"
                placeholder="Search by name…"
                leftIcon={<Search />}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus /> Add Student
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            {isLoading && <p className="px-6 py-10 text-center text-sm text-zinc-500">Loading…</p>}

            {!isLoading && students && students.length === 0 && (
              <p className="px-6 py-10 text-center text-sm text-zinc-500">No students found.</p>
            )}

            {!isLoading && students && students.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-[11px] uppercase tracking-wide text-zinc-400">
                    <tr>
                      <th className="px-6 py-3 font-semibold">#</th>
                      <th className="px-6 py-3 font-semibold">Admission No.</th>
                      <th className="px-6 py-3 font-semibold">Name</th>
                      <th className="px-6 py-3 font-semibold">Gender</th>
                      <th className="px-6 py-3 font-semibold">Class</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {students.map((s, index) => (
                      <tr
                        key={s.id}
                        onClick={() => navigate(`/students/${s.id}`)}
                        className="cursor-pointer transition-colors hover:bg-zinc-50"
                      >
                        <td className="px-6 py-3 tabular-nums text-zinc-400">{index + 1}</td>
                        <td className="px-6 py-3 text-zinc-500">{s.admissionNumber}</td>
                        <td className="px-6 py-3 font-medium text-zinc-900">
                          {formatName(s.firstName, s.lastName)}
                        </td>
                        <td className="px-6 py-3 text-zinc-500">
                          {s.gender === 'MALE' ? 'Male' : s.gender === 'FEMALE' ? 'Female' : 'Not set'}
                        </td>
                        <td className="px-6 py-3 text-zinc-500">{s.class ? titleCase(s.class.name) : 'Not assigned'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
