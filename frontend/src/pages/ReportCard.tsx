import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { FileText, Printer } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { ReportCardDocument } from '../components/ReportCardDocument';
import { apiFetch } from '../api/client';
import type { AcademicYear, SchoolSettings, StudentReportCard, Term } from '../types';

export function ReportCardPage() {
  const { id } = useParams<{ id: string }>();

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
    queryKey: ['report-card', id, termId],
    queryFn: () => apiFetch<StudentReportCard>(`/students/${id}/report-card?termId=${termId}`),
    enabled: !!id && !!termId,
    retry: false,
  });

  return (
    <DashboardLayout
      title="Report Card"
      icon={FileText}
      actions={
        report && (
          <Button size="sm" onClick={() => window.print()}>
            <Printer /> Print
          </Button>
        )
      }
    >
      <div className="mb-4 flex flex-wrap items-end gap-3 print:hidden">
        <Link to={`/students/${id}`} className="text-sm text-primary-700 hover:underline">
          ← Back to Student
        </Link>
        <div className="ml-auto flex gap-3">
          <div className="w-40">
            <Select
              value={academicYearId}
              onValueChange={setAcademicYearId}
              options={(academicYears ?? []).map((y) => ({ value: y.id, label: y.name }))}
            />
          </div>
          <div className="w-40">
            <Select
              value={termId}
              onValueChange={setTermId}
              options={(terms ?? []).map((t) => ({ value: t.id, label: t.name }))}
            />
          </div>
        </div>
      </div>

      {isLoading && <p className="text-sm text-zinc-500">Loading…</p>}

      {isError && (
        <p className="text-sm text-danger-600">
          {error instanceof Error ? error.message : 'Could not load this report card.'}
        </p>
      )}

      {report && school && <ReportCardDocument report={report} school={school} />}
    </DashboardLayout>
  );
}
