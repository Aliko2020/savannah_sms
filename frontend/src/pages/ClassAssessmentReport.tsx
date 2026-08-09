import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Select } from '../components/ui/Select';
import { ClassReportTable } from '../components/ClassReportTable';
import { apiFetch } from '../api/client';
import { titleCase } from '../utils/format';
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
    <DashboardLayout title="View Class Assessment" icon={ClipboardList}>
      {loadingTeacher && <p className="text-sm text-zinc-500">Loading…</p>}

      {!loadingTeacher && !assignedClass && (
        <p className="text-sm text-zinc-500">You are not currently assigned to a class.</p>
      )}

      {!loadingTeacher && assignedClass && (
        <div>
          <div className="mb-6 max-w-sm rounded-xl border border-border bg-surface p-6 shadow-sm">
            <Select
              label="Term"
              required
              placeholder="Select a term"
              value={termId || undefined}
              onValueChange={setTermId}
              disabled={!terms || terms.length === 0}
              options={(terms ?? []).map((t) => ({ value: t.id, label: t.name }))}
              hint={terms && terms.length === 0 ? 'No terms have been set up yet.' : undefined}
            />
          </div>

          {termId && (
            <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
              <h2 className="border-b border-border px-6 py-4 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                {titleCase(assignedClass.name)}
              </h2>

              {loadingReport && <p className="px-6 py-8 text-center text-sm text-zinc-500">Loading…</p>}

              {!loadingReport && report && <ClassReportTable report={report} />}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
