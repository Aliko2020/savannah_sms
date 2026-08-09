import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BookOpen } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { apiFetch, ApiError } from '../api/client';
import { formatName, titleCase } from '../utils/format';
import { CLASS_CATEGORY_LABELS } from '../constants';
import type { ClassItem, ClassSubjectItem, Subject, Teacher } from '../types';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

// Radix Select reserves the empty string for "no selection".
const UNASSIGNED = '__unassigned__';

interface SubjectRow {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  classSubjectId: string | null;
  teacherId: string | null;
}

export function ClassSubjectsPage() {
  const { classId } = useParams<{ classId: string }>();
  const queryClient = useQueryClient();

  const { data: classes } = useQuery({
    queryKey: ['classes', 'all'],
    queryFn: () => apiFetch<ClassItem[]>('/classes'),
  });
  const classItem = classes?.find((c) => c.id === classId);

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiFetch<Subject[]>('/subjects'),
  });

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['class-subjects', classId],
    queryFn: () => apiFetch<ClassSubjectItem[]>(`/class-subjects?classId=${classId}`),
    enabled: !!classId,
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => apiFetch<Teacher[]>('/teachers'),
  });

  const rows: SubjectRow[] =
    classItem && subjects
      ? subjects
          .filter((s) => s.categories.includes(classItem.category))
          .map((s) => {
            const assignment = assignments?.find((a) => a.subjectId === s.id);
            return {
              subjectId: s.id,
              subjectName: s.name,
              subjectCode: s.code,
              classSubjectId: assignment?.id ?? null,
              teacherId: assignment?.teacher?.id ?? null,
            };
          })
      : [];

  // Per-row pending teacher selection, initialized from the current assignment.
  // Only synced once all three sources have loaded (and re-synced whenever
  // any of them changes, e.g. after a save invalidates the assignment list) —
  // syncing before `assignments` arrives would lock in a stale "unassigned"
  // value that the real data could never overwrite.
  const [selections, setSelections] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!assignments || !subjects || !classItem) return;
    setSelections(Object.fromEntries(rows.map((row) => [row.subjectId, row.teacherId ?? ''])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments, subjects, classItem]);

  const saveAssignment = useMutation({
    mutationFn: ({ subjectId, classSubjectId, teacherId }: { subjectId: string; classSubjectId: string | null; teacherId: string }) =>
      classSubjectId
        ? apiFetch(`/class-subjects/${classSubjectId}`, {
            method: 'PATCH',
            body: JSON.stringify({ teacherId: teacherId || null }),
          })
        : apiFetch('/class-subjects', {
            method: 'POST',
            body: JSON.stringify({ classId, subjectId, teacherId: teacherId || undefined }),
          }),
    onSuccess: () => {
      toast.success('Assignment saved.');
      queryClient.invalidateQueries({ queryKey: ['class-subjects', classId] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save assignment.')),
  });

  const removeAssignment = useMutation({
    mutationFn: (classSubjectId: string) => apiFetch(`/class-subjects/${classSubjectId}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Assignment removed.');
      queryClient.invalidateQueries({ queryKey: ['class-subjects', classId] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not remove assignment.')),
  });

  function handleRemove(row: SubjectRow) {
    if (!row.classSubjectId) return;
    if (window.confirm(`Remove ${row.subjectName} from this class? This can't be undone if no scores exist yet.`)) {
      removeAssignment.mutate(row.classSubjectId);
    }
  }

  return (
    <DashboardLayout title="Class Subjects" icon={BookOpen}>
      <Link to="/classes" className="mb-4 inline-block text-sm text-primary-700 hover:underline">
        ← Back to Class Setup
      </Link>

      <div className="max-w-3xl">
        {classItem && (
          <p className="mb-4 text-sm text-zinc-600">
            {titleCase(classItem.name)} · <span className="text-zinc-500">{CLASS_CATEGORY_LABELS[classItem.category]}</span>
          </p>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          {isLoading && <p className="px-6 py-8 text-center text-sm text-zinc-500">Loading…</p>}

          {!isLoading && rows.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-zinc-500">
              No subjects apply to this class's category yet.
            </p>
          )}

          {!isLoading && rows.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-[11px] uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-6 py-3 font-semibold">Subject</th>
                  <th className="px-6 py-3 font-semibold">Teacher</th>
                  <th className="px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.subjectId}>
                    <td className="px-6 py-3 text-zinc-900">
                      {row.subjectName} <span className="text-zinc-400">({row.subjectCode})</span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="max-w-[14rem]">
                        <Select
                          fieldSize="sm"
                          value={selections[row.subjectId] || UNASSIGNED}
                          onValueChange={(v) => setSelections({ ...selections, [row.subjectId]: v === UNASSIGNED ? '' : v })}
                          options={[
                            { value: UNASSIGNED, label: '— Unassigned —' },
                            ...(teachers ?? []).map((t) => ({ value: t.id, label: formatName(t.firstName, t.lastName) })),
                          ]}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={saveAssignment.isPending}
                          onClick={() =>
                            saveAssignment.mutate({
                              subjectId: row.subjectId,
                              classSubjectId: row.classSubjectId,
                              teacherId: selections[row.subjectId] ?? '',
                            })
                          }
                        >
                          Save
                        </Button>
                        {row.classSubjectId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                            disabled={removeAssignment.isPending}
                            onClick={() => handleRemove(row)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
