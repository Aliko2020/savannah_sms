import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileStack, Printer } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { ReportCardDocument } from '../components/ReportCardDocument';
import { apiFetch } from '../api/client';
import { titleCase } from '../utils/format';
import type { AcademicYear, ClassItem, ClassReportCards, SchoolSettings, Term } from '../types';

export function BulkReportCardsPage() {
  const { data: school } = useQuery({
    queryKey: ['school-settings'],
    queryFn: () => apiFetch<SchoolSettings>('/school-settings'),
  });

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => apiFetch<AcademicYear[]>('/academic-years'),
  });
  const [academicYearId, setAcademicYearId] = useState('');
  useEffect(() => {
    if (!academicYearId && academicYears && academicYears.length > 0) {
      setAcademicYearId(academicYears.find((y) => y.isCurrent)?.id ?? academicYears[0].id);
    }
  }, [academicYears, academicYearId]);

  const { data: classes } = useQuery({
    queryKey: ['classes', academicYearId],
    queryFn: () => apiFetch<ClassItem[]>(`/classes?academicYearId=${academicYearId}`),
    enabled: !!academicYearId,
  });
  const [classId, setClassId] = useState('');
  useEffect(() => {
    setClassId('');
  }, [academicYearId]);
  useEffect(() => {
    if (!classId && classes && classes.length > 0) {
      setClassId(classes[0].id);
    }
  }, [classes, classId]);

  const { data: terms } = useQuery({
    queryKey: ['terms', academicYearId],
    queryFn: () => apiFetch<Term[]>(`/terms?academicYearId=${academicYearId}`),
    enabled: !!academicYearId,
  });
  const [termId, setTermId] = useState('');
  useEffect(() => {
    setTermId('');
  }, [academicYearId]);
  useEffect(() => {
    if (!termId && terms && terms.length > 0) {
      setTermId(terms.find((t) => t.isCurrent)?.id ?? terms[0].id);
    }
  }, [terms, termId]);

  const {
    data: report,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['class-report-cards', classId, termId],
    queryFn: () => apiFetch<ClassReportCards>(`/classes/${classId}/report-cards?termId=${termId}`),
    enabled: !!classId && !!termId,
    retry: false,
  });

  return (
    <DashboardLayout
      title="Report Cards"
      icon={FileStack}
      actions={
        report &&
        report.students.length > 0 && (
          <Button size="sm" onClick={() => window.print()}>
            <Printer /> Print All
          </Button>
        )
      }
    >
      <div className="mb-6 flex flex-wrap items-end gap-3 print:hidden">
        <div className="w-44">
          <Select
            label="Academic Year"
            value={academicYearId}
            onValueChange={setAcademicYearId}
            options={(academicYears ?? []).map((y) => ({ value: y.id, label: y.name }))}
          />
        </div>
        <div className="w-52">
          <Select
            label="Class"
            value={classId}
            onValueChange={setClassId}
            options={(classes ?? []).map((c) => ({ value: c.id, label: titleCase(c.name) }))}
          />
        </div>
        <div className="w-40">
          <Select
            label="Term"
            value={termId}
            onValueChange={setTermId}
            options={(terms ?? []).map((t) => ({ value: t.id, label: t.name }))}
          />
        </div>
      </div>

      {isLoading && <p className="text-sm text-zinc-500">Loading…</p>}

      {isError && (
        <p className="text-sm text-danger-600">
          {error instanceof Error ? error.message : 'Could not load report cards for this class.'}
        </p>
      )}

      {report && report.students.length === 0 && (
        <p className="text-sm text-zinc-500">No students enrolled in this class yet.</p>
      )}

      {report && school && report.students.length > 0 && (
        <div className="space-y-8 print:space-y-0">
          {report.students.map((studentReport) => (
            <div key={studentReport.student.id} className="print:break-after-page">
              <ReportCardDocument report={studentReport} school={school} />
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
