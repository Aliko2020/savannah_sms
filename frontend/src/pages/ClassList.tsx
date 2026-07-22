import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '../components/AppLayout';
import { PageHeader } from '../components/PageHeader';
import { apiFetch } from '../api/client';
import { UsersIcon } from '../components/icons';
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
    <AppLayout>
      <PageHeader title="Class List" icon={UsersIcon} />

      {loadingTeacher && <p className="text-sm text-slate-500">Loading…</p>}

      {!loadingTeacher && !assignedClass && (
        <p className="text-sm text-slate-500">You are not currently assigned to a class.</p>
      )}

      {!loadingTeacher && assignedClass && (
        <div className="max-w-5xl overflow-hidden rounded-lg bg-white shadow">
          <h2 className="border-b border-slate-100 px-6 py-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
            {titleCase(assignedClass.name)}
          </h2>

          {loadingStudents && <p className="px-6 py-8 text-center text-sm text-slate-500">Loading…</p>}

          {!loadingStudents && classStudents && classStudents.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-slate-500">No students enrolled in this class yet.</p>
          )}

          {!loadingStudents && classStudents && classStudents.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-6 py-3 font-semibold">#</th>
                    <th className="px-6 py-3 font-semibold">Admission No.</th>
                    <th className="px-6 py-3 font-semibold">Name</th>
                    <th className="px-6 py-3 font-semibold">Gender</th>
                    <th className="px-6 py-3 font-semibold">Parent/Guardian Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.map((s, index) => (
                    <tr key={s.id}>
                      <td className="px-6 py-3 text-slate-400">{index + 1}</td>
                      <td className="px-6 py-3 text-slate-500">{s.admissionNumber}</td>
                      <td className="px-6 py-3 font-medium text-slate-900">{formatName(s.firstName, s.lastName)}</td>
                      <td className="px-6 py-3 text-slate-500">
                        {s.gender === 'MALE' ? 'Male' : s.gender === 'FEMALE' ? 'Female' : '—'}
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        {s.guardianName ? (
                          <>
                            <span className="text-slate-900">{s.guardianName}</span>
                            {s.guardianRelation && (
                              <span className="text-xs text-slate-400"> ({GUARDIAN_RELATION_LABELS[s.guardianRelation]})</span>
                            )}
                            {s.guardianPhone && <div className="text-xs text-slate-500">{s.guardianPhone}</div>}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
