import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AppLayout } from './AppLayout';
import { PageHeader } from './PageHeader';
import { apiFetch, ApiError } from '../api/client';
import { GraduationCapIcon } from './icons';
import { formatName, titleCase } from '../utils/format';
import type { AcademicYear, ClassSubjectItem, StudentScore, Subject, TeacherDetail, Term } from '../types';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

interface ScoreDraft {
  editable: string; // the score field this page lets the teacher edit
  fixed: number | null; // the other score field, carried through unchanged
}

interface AssessmentEntryProps {
  mode: 'class' | 'exam';
  title: string;
  scoreLabel: string;
}

// Teachers enter both scores on a raw 0-100 scale; the total weights them
// down to a class:exam split of 40:60 out of 100.
const CLASS_WEIGHT = 0.4;
const EXAM_WEIGHT = 0.6;

export function AssessmentEntry({ mode, title, scoreLabel }: AssessmentEntryProps) {
  const queryClient = useQueryClient();

  const { data: teacher, isLoading: loadingTeacher } = useQuery({
    queryKey: ['teacher', 'me'],
    queryFn: () => apiFetch<TeacherDetail>('/teachers/me'),
  });
  const assignedClass = teacher?.assignedClasses[0];

  const { data: subjects } = useQuery({
    queryKey: ['subjects', assignedClass?.category],
    queryFn: () => apiFetch<Subject[]>(`/subjects?category=${assignedClass!.category}`),
    enabled: !!assignedClass,
  });

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

  const [subjectId, setSubjectId] = useState('');
  const [termId, setTermId] = useState('');
  const [drafts, setDrafts] = useState<Record<string, ScoreDraft>>({});

  // Finds (or transparently creates) the teaching-unit link for this class + subject.
  const { data: classSubject, isLoading: loadingClassSubject } = useQuery({
    queryKey: ['class-subject-ensure', assignedClass?.id, subjectId],
    queryFn: () =>
      apiFetch<ClassSubjectItem>('/class-subjects/ensure', {
        method: 'POST',
        body: JSON.stringify({ classId: assignedClass!.id, subjectId }),
      }),
    enabled: !!assignedClass && !!subjectId,
  });

  const { data: roster, isLoading: loadingRoster } = useQuery({
    queryKey: ['scores', classSubject?.id, termId],
    queryFn: () => apiFetch<StudentScore[]>(`/scores?classSubjectId=${classSubject!.id}&termId=${termId}`),
    enabled: !!classSubject && !!termId,
  });

  useEffect(() => {
    if (!roster) return;
    const next: Record<string, ScoreDraft> = {};
    for (const s of roster) {
      const editableValue = mode === 'class' ? s.classScore : s.examScore;
      const fixedValue = mode === 'class' ? s.examScore : s.classScore;
      next[s.studentId] = {
        editable: editableValue !== null ? String(editableValue) : '',
        fixed: fixedValue,
      };
    }
    setDrafts(next);
  }, [roster, mode]);

  function updateDraft(studentId: string, value: string) {
    setDrafts((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], editable: value },
    }));
  }

  const saveScores = useMutation({
    mutationFn: () =>
      apiFetch('/scores', {
        method: 'PUT',
        body: JSON.stringify({
          classSubjectId: classSubject!.id,
          termId,
          scores: Object.entries(drafts).map(([studentId, d]) => {
            const editableValue = d.editable === '' ? null : Number(d.editable);
            return {
              studentId,
              classScore: mode === 'class' ? editableValue : d.fixed,
              examScore: mode === 'exam' ? editableValue : d.fixed,
            };
          }),
        }),
      }),
    onSuccess: () => {
      toast.success('Scores saved.');
      queryClient.invalidateQueries({ queryKey: ['scores', classSubject?.id, termId] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save scores.')),
  });

  return (
    <AppLayout>
      <PageHeader title={title} icon={GraduationCapIcon} />

      {mode === 'class' && (
        <div className="mb-4 flex justify-end">
          <Link
            to="/teachers/assessment/view"
            className="rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-light"
          >
            View Class Assessment
          </Link>
        </div>
      )}

      {loadingTeacher && <p className="text-sm text-slate-500">Loading…</p>}

      {!loadingTeacher && !assignedClass && (
        <p className="text-sm text-slate-500">You are not currently assigned to a class.</p>
      )}

      {!loadingTeacher && assignedClass && (
        <div className="max-w-5xl">
          <div className="mb-6 grid grid-cols-1 gap-4 rounded-lg bg-white p-6 shadow sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Class</label>
              <p className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {titleCase(assignedClass.name)}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                disabled={!subjects || subjects.length === 0}
              >
                <option value="">Select a subject</option>
                {subjects?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {subjects && subjects.length === 0 && (
                <p className="mt-1 text-xs text-slate-500">No subjects have been added yet.</p>
              )}
            </div>
            <div>
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
          </div>

          {subjectId && termId && (
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <h2 className="border-b border-slate-100 px-6 py-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                {titleCase(assignedClass.name)} — {subjects?.find((s) => s.id === subjectId)?.name}
              </h2>

              {(loadingClassSubject || loadingRoster) && (
                <p className="px-6 py-8 text-center text-sm text-slate-500">Loading…</p>
              )}

              {!loadingClassSubject && !loadingRoster && roster && roster.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-slate-500">No students enrolled in this class yet.</p>
              )}

              {!loadingClassSubject && !loadingRoster && roster && roster.length > 0 && (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                        <tr>
                          <th className="px-6 py-3 font-semibold">#</th>
                          <th className="px-6 py-3 font-semibold">Admission No.</th>
                          <th className="px-6 py-3 font-semibold">Name</th>
                          <th className="px-6 py-3 font-semibold">{scoreLabel} (out of 100)</th>
                          <th className="px-6 py-3 font-semibold">Total (out of 100)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {roster.map((s, index) => {
                          const draft = drafts[s.studentId] ?? { editable: '', fixed: null };
                          const editableVal = draft.editable === '' ? null : Number(draft.editable);
                          const classRaw = mode === 'class' ? editableVal : draft.fixed;
                          const examRaw = mode === 'exam' ? editableVal : draft.fixed;
                          const total =
                            classRaw !== null && examRaw !== null
                              ? classRaw * CLASS_WEIGHT + examRaw * EXAM_WEIGHT
                              : null;

                          return (
                            <tr key={s.studentId}>
                              <td className="px-6 py-3 text-slate-400">{index + 1}</td>
                              <td className="px-6 py-3 text-slate-500">{s.admissionNumber}</td>
                              <td className="px-6 py-3 font-medium text-slate-900">
                                {formatName(s.firstName, s.lastName)}
                              </td>
                              <td className="px-6 py-3">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step="0.01"
                                  className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
                                  value={draft.editable}
                                  onChange={(e) => updateDraft(s.studentId, e.target.value)}
                                />
                              </td>
                              <td className="px-6 py-3 text-slate-500">{total !== null ? Math.round(total * 100) / 100 : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-slate-100 px-6 py-4">
                    <button
                      onClick={() => saveScores.mutate()}
                      disabled={saveScores.isPending}
                      className="rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-light disabled:opacity-50"
                    >
                      {saveScores.isPending ? 'Saving…' : 'Save scores'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
