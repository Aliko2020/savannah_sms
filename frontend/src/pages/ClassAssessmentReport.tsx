import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '../components/AppLayout';
import { PageHeader } from '../components/PageHeader';
import { apiFetch } from '../api/client';
import { GraduationCapIcon } from '../components/icons';
import { formatName, titleCase } from '../utils/format';
import type { AcademicYear, ClassReport, TeacherDetail, Term } from '../types';

export function ClassAssessmentReportPage() {
  const { data: teacher, isLoading: loadingTeacher } = useQuery({
    queryKey: ['teacher', 'me'],
    queryFn: () => apiFetch<TeacherDetail>('/teachers/me'),
  });
  const assignedClass = teacher?.assignedClasses[0];

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => apiFetch<AcademicYear[]>('/academic-years'),
  });
  const currentYear = academicYears?.find((y) => y.isCurrent) ?? academicYears?.[0];

  const { data: terms } = useQuery({
    queryKey: ['terms', currentYear?.id],
    queryFn: () => apiFetch<Term[]>(`/terms?academicYearId=${currentYear!.id}`),
    enabled: !!currentYear,
  });

  const [termId, setTermId] = useState('');

  const { data: report, isLoading: loadingReport } = useQuery({
    queryKey: ['class-report', assignedClass?.id, termId],
    queryFn: () => apiFetch<ClassReport>(`/classes/${assignedClass!.id}/report?termId=${termId}`),
    enabled: !!assignedClass && !!termId,
  });

  return (
    <AppLayout>
      <PageHeader title="View Class Assessment" icon={GraduationCapIcon} />

      {loadingTeacher && <p className="text-sm text-slate-500">Loading…</p>}

      {!loadingTeacher && !assignedClass && (
        <p className="text-sm text-slate-500">You are not currently assigned to a class.</p>
      )}

      {!loadingTeacher && assignedClass && (
        <div>
          <div className="mb-6 max-w-sm rounded-lg bg-white p-6 shadow">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Term <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
              disabled={!terms || terms.length === 0}
            >
              <option value="">Select a term</option>
              {terms?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {terms && terms.length === 0 && (
              <p className="mt-1 text-xs text-slate-500">No terms have been set up yet.</p>
            )}
          </div>

          {termId && (
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <h2 className="border-b border-slate-100 px-6 py-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                {titleCase(assignedClass.name)}
              </h2>

              {loadingReport && <p className="px-6 py-8 text-center text-sm text-slate-500">Loading…</p>}

              {!loadingReport && report && report.subjects.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-slate-500">
                  No subjects have been entered for this class yet.
                </p>
              )}

              {!loadingReport && report && report.subjects.length > 0 && report.students.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-slate-500">No students enrolled in this class yet.</p>
              )}

              {!loadingReport && report && report.subjects.length > 0 && report.students.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-slate-400">
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th rowSpan={2} className="px-6 py-3 align-bottom font-semibold">
                          Student Number
                        </th>
                        <th rowSpan={2} className="px-6 py-3 align-bottom font-semibold">
                          Student Name
                        </th>
                        <th colSpan={report.subjects.length} className="px-6 py-2 text-center font-semibold">
                          Subjects
                        </th>
                      </tr>
                      <tr className="border-b border-slate-100">
                        {report.subjects.map((s) => (
                          <th key={s.classSubjectId} className="px-6 py-3 text-center font-bold text-slate-700">
                            {s.subjectName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.students.map((s) => (
                        <tr key={s.studentId}>
                          <td className="px-6 py-3 text-slate-500">{s.admissionNumber}</td>
                          <td className="px-6 py-3 font-medium text-slate-900">
                            {formatName(s.firstName, s.lastName)}
                          </td>
                          {report.subjects.map((subj) => {
                            const score = s.scores[subj.classSubjectId];
                            return (
                              <td key={subj.classSubjectId} className="px-6 py-3 text-center text-slate-700">
                                {score !== null ? Math.round(score * 100) / 100 : '—'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
