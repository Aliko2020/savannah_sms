import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { ScoreSheetDocument } from '../components/ScoreSheetDocument';
import { apiFetch } from '../api/client';
import { titleCase } from '../utils/format';
import type { AcademicYear, ClassItem, ClassStudent, SchoolSettings, Term } from '../types';

export function ScoreSheetPage() {
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
  const academicYear = academicYears?.find((y) => y.id === academicYearId);

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
  const term = terms?.find((t) => t.id === termId);

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
  const selectedClass = classes?.find((c) => c.id === classId);

  const {
    data: students,
    isLoading: loadingStudents,
    isError,
    error,
  } = useQuery({
    queryKey: ['class-students', classId],
    queryFn: () => apiFetch<ClassStudent[]>(`/classes/${classId}/students`),
    enabled: !!classId,
    retry: false,
  });

  const ready = !!school && !!academicYear && !!term && !!selectedClass && !!students;

  return (
    <DashboardLayout
      title="Score Sheet"
      icon={FileSpreadsheet}
      actions={
        ready && (
          <Button size="sm" onClick={() => window.print()}>
            <Printer /> Print
          </Button>
        )
      }
    >
      <div className="mb-6 flex flex-wrap items-end gap-3 print:hidden">
        <div className="w-44">
          <Select
            label="Academic Year"
            required
            value={academicYearId}
            onValueChange={setAcademicYearId}
            options={(academicYears ?? []).map((y) => ({ value: y.id, label: y.name }))}
          />
        </div>
        <div className="w-40">
          <Select
            label="Academic Term"
            required
            placeholder="Select a term"
            value={termId || undefined}
            onValueChange={setTermId}
            disabled={!terms || terms.length === 0}
            options={(terms ?? []).map((t) => ({ value: t.id, label: t.name }))}
            hint={terms && terms.length === 0 ? 'No terms have been set up yet.' : undefined}
          />
        </div>
        <div className="w-52">
          <Select
            label="Class"
            required
            placeholder="Select a class"
            value={classId || undefined}
            onValueChange={setClassId}
            disabled={!classes || classes.length === 0}
            options={(classes ?? []).map((c) => ({ value: c.id, label: titleCase(c.name) }))}
            hint={classes && classes.length === 0 ? 'No classes have been set up yet.' : undefined}
          />
        </div>
      </div>

      {loadingStudents && <p className="text-sm text-zinc-500 print:hidden">Loading…</p>}

      {isError && (
        <p className="text-sm text-danger-600 print:hidden">
          {error instanceof Error ? error.message : 'Could not load students for this class.'}
        </p>
      )}

      {students && students.length === 0 && (
        <p className="text-sm text-zinc-500 print:hidden">No students enrolled in this class yet.</p>
      )}

      {ready && students.length > 0 && (
        <ScoreSheetDocument
          title="Students Termly Score Sheet"
          academicYearName={academicYear.name}
          className={titleCase(selectedClass.name)}
          termName={term.name}
          students={students}
          school={school}
        />
      )}
    </DashboardLayout>
  );
}
