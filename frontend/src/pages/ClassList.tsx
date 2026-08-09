import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FileText, Users } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { apiFetch } from '../api/client';
import { formatName, titleCase } from '../utils/format';
import { GUARDIAN_RELATION_LABELS } from '../constants';
import type { ClassStudent, TeacherDetail } from '../types';

export function ClassListPage() {
  const { data: teacher, isLoading: loadingTeacher } = useQuery({
    queryKey: ['teacher', 'me'],
    queryFn: () => apiFetch<TeacherDetail>('/teachers/me'),
  });

  const assignedClass = teacher?.assignedClasses[0];

  const { data: classStudents, isLoading: loadingStudents } = useQuery({
    queryKey: ['class-students', assignedClass?.id],
    queryFn: () => apiFetch<ClassStudent[]>(`/classes/${assignedClass!.id}/students`),
    enabled: !!assignedClass,
  });

  return (
    <DashboardLayout title="Class List" icon={Users}>
      {loadingTeacher && <p className="text-sm text-zinc-500">Loading…</p>}

      {!loadingTeacher && !assignedClass && (
        <p className="text-sm text-zinc-500">You are not currently assigned to a class.</p>
      )}

      {!loadingTeacher && assignedClass && (
        <div className="max-w-5xl overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <h2 className="border-b border-border px-6 py-4 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            {titleCase(assignedClass.name)}
          </h2>

          {loadingStudents && <p className="px-6 py-8 text-center text-sm text-zinc-500">Loading…</p>}

          {!loadingStudents && classStudents && classStudents.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-zinc-500">No students enrolled in this class yet.</p>
          )}

          {!loadingStudents && classStudents && classStudents.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-[11px] uppercase tracking-wide text-zinc-400">
                  <tr>
                    <th className="px-6 py-3 font-semibold">#</th>
                    <th className="px-6 py-3 font-semibold">Admin No.</th>
                    <th className="px-6 py-3 font-semibold">Name</th>
                    <th className="px-6 py-3 font-semibold">Gender</th>
                    <th className="px-6 py-3 font-semibold">Guardian Contact</th>
                    <th className="px-6 py-3 font-semibold">House Address</th>
                    <th className="px-6 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {classStudents.map((s, index) => (
                    <tr key={s.id} className="transition-colors hover:bg-zinc-50">
                      <td className="px-6 py-3 tabular-nums text-zinc-400">{index + 1}</td>
                      <td className="px-6 py-3 text-zinc-500">{s.admissionNumber}</td>
                      <td className="px-6 py-3 font-medium text-zinc-900">{formatName(s.firstName, s.lastName)}</td>
                      <td className="px-6 py-3 text-zinc-500">
                        {s.gender === 'MALE' ? 'Male' : s.gender === 'FEMALE' ? 'Female' : 'Not set'}
                      </td>
                      <td className="px-6 py-3 text-zinc-500">
                        {s.guardianName ? (
                          <span className='flex gap-2 items-center'>
                            <span className="text-zinc-900">{s.guardianName}</span>
                            {s.guardianRelation && (
                              <span className="text-xs text-zinc-400"> ({GUARDIAN_RELATION_LABELS[s.guardianRelation]})</span>
                            )}
                            {s.guardianPhone && <div className="text-xs text-zinc-500">{s.guardianPhone}</div>}
                          </span>
                        ) : (
                          'Not provided'
                        )}
                      </td>
                      <td className="px-6 py-3 text-zinc-500">{s.guardianAddress ?? 'Not provided'}</td>
                      <td className="px-6 py-3">
                        <Button asChild size="sm" variant="ghost">
                          <Link to={`/students/${s.id}/report-card`}>
                            <FileText /> Report Card
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
