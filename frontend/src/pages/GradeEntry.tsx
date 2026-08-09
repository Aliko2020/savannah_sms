import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { NotebookPen } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { ScoreEntryTable, type ScoreDraft } from '../components/ScoreEntryTable';
import { apiFetch, ApiError } from '../api/client';
import { LockIcon } from '../components/icons';
import { titleCase } from '../utils/format';
import type { ClassSubjectItem, CurrentTerm, ScoreRoster, Subject, TeacherDetail } from '../types';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function GradeEntryPage() {
  const queryClient = useQueryClient();

  const { data: teacher, isLoading: loadingTeacher } = useQuery({
    queryKey: ['teacher', 'me'],
    queryFn: () => apiFetch<TeacherDetail>('/teachers/me'),
  });
  const assignedClass = teacher?.assignedClasses[0];

  // The active term is fetched and locked — teachers never choose it.
  const {
    data: currentTerm,
    isLoading: loadingTerm,
    error: termError,
  } = useQuery({
    queryKey: ['terms', 'current'],
    queryFn: () => apiFetch<CurrentTerm>('/terms/current'),
    retry: false,
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects', assignedClass?.category],
    queryFn: () => apiFetch<Subject[]>(`/subjects?category=${assignedClass!.category}`),
    enabled: !!assignedClass,
  });

  const [subjectId, setSubjectId] = useState('');
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
    queryKey: ['scores', classSubject?.id, currentTerm?.id],
    // No termId is sent — the server resolves it to the active term itself.
    queryFn: () => apiFetch<ScoreRoster>(`/scores?classSubjectId=${classSubject!.id}`),
    enabled: !!classSubject && !!currentTerm,
  });

  useEffect(() => {
    if (!roster) return;
    const next: Record<string, ScoreDraft> = {};
    for (const s of roster.students) {
      next[s.studentId] = {
        classScore: s.classScore !== null ? String(s.classScore) : '',
        examScore: s.examScore !== null ? String(s.examScore) : '',
      };
    }
    setDrafts(next);
  }, [roster]);

  function updateDraft(studentId: string, field: 'classScore' | 'examScore', value: string) {
    setDrafts((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));
  }

  const saveScores = useMutation({
    mutationFn: () =>
      apiFetch('/scores', {
        method: 'PUT',
        body: JSON.stringify({
          classSubjectId: classSubject!.id,
          // Included for clarity, but the server ignores it for teachers and
          // always resolves against whatever term is currently active.
          termId: currentTerm!.id,
          scores: Object.entries(drafts).map(([studentId, d]) => ({
            studentId,
            classScore: d.classScore === '' ? null : Number(d.classScore),
            examScore: d.examScore === '' ? null : Number(d.examScore),
          })),
        }),
      }),
    onSuccess: () => {
      toast.success('Scores saved.');
      queryClient.invalidateQueries({ queryKey: ['scores', classSubject?.id, currentTerm?.id] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save scores.')),
  });

  return (
    <DashboardLayout title="Grade Entry" icon={NotebookPen}>
      {loadingTeacher && <p className="text-sm text-zinc-500">Loading…</p>}

      {!loadingTeacher && !assignedClass && (
        <p className="text-sm text-zinc-500">You are not currently assigned to a class.</p>
      )}

      {!loadingTeacher && assignedClass && (
        <div className="max-w-7xl">
          <div className="mb-6 grid grid-cols-1 items-start gap-4 rounded-xl border border-border bg-surface p-6 shadow-sm md:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-zinc-700">Class</label>
              <p className="rounded-lg border border-border bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                {titleCase(assignedClass.name)}
              </p>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1 text-[13px] font-medium text-zinc-700">
                Academic Year <LockIcon className="h-3.5 w-3.5 text-zinc-400" />
              </label>
              {loadingTerm ? (
                <p className="rounded-lg border border-border px-3 py-2 text-sm text-zinc-400">Loading…</p>
              ) : (
                <span className="inline-flex w-full items-center gap-1.5 rounded-lg border border-primary-900/15 bg-zinc-50 px-3 py-2 text-sm">
                  {currentTerm ? currentTerm.academicYear.name : '—'}
                </span>
              )}
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1 text-[13px] font-medium text-zinc-700">
                Active Term <LockIcon className="h-3.5 w-3.5 text-zinc-400" />
              </label>
              {loadingTerm ? (
                <p className="rounded-lg border border-border bg-zinc-50 px-3 py-2 text-sm text-zinc-400">Loading…</p>
              ) : (
                <span className="inline-flex w-full items-center gap-1.5 rounded-lg border border-primary-900/15 bg-zinc-50 px-3 py-2 text-sm">
                  {currentTerm ? currentTerm.name : '—'}
                </span>
              )}
            </div>

            <div>
              <Select
                label="Subject"
                required
                placeholder="Select a subject"
                value={subjectId || undefined}
                onValueChange={setSubjectId}
                disabled={!subjects || subjects.length === 0 || !currentTerm}
                options={(subjects ?? []).map((s) => ({ value: s.id, label: s.name }))}
                hint={subjects && subjects.length === 0 ? 'No subjects have been added yet.' : undefined}
              />
            </div>
          </div>

          {!loadingTerm && termError && (
            <div className="rounded-lg border border-warning-500/20 bg-warning-50 px-6 py-4 text-sm text-warning-700">
              {errorMessage(termError, 'No active term has been set. Ask an administrator to activate a term.')}
            </div>
          )}

          {currentTerm && subjectId && (
            <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
              <h2 className="border-b border-border px-6 py-4 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                {titleCase(assignedClass.name)} — {subjects?.find((s) => s.id === subjectId)?.name} — {currentTerm.name}
              </h2>

              {(loadingClassSubject || loadingRoster) && (
                <p className="px-6 py-8 text-center text-sm text-zinc-500">Loading…</p>
              )}

              {!loadingClassSubject && !loadingRoster && roster && (
                <>
                  <ScoreEntryTable roster={roster} drafts={drafts} onChange={updateDraft} />

                  {roster.students.length > 0 && (
                    <div className="border-t border-border px-6 py-4">
                      <Button loading={saveScores.isPending} onClick={() => saveScores.mutate()}>
                        Save scores
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
