import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { TrendingUp } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { apiFetch, ApiError } from '../api/client';
import { cn } from '../lib/cn';
import { formatName, titleCase } from '../utils/format';
import type { GradeLevel, PromotionDecision, PromotionResultItem, PromotionRun, SectionStrategy } from '../types';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

const DECISIONS: PromotionDecision[] = ['PROMOTED', 'PROBATION', 'REPEATED', 'GRADUATED'];

const DECISION_STYLES: Record<PromotionDecision, string> = {
  PROMOTED: 'bg-success-50 text-success-700',
  PROBATION: 'bg-warning-50 text-warning-700',
  REPEATED: 'bg-danger-50 text-danger-700',
  GRADUATED: 'bg-info-50 text-info-700',
};

// Radix Select reserves the empty string for "no selection".
const GRADUATES = '__graduates__';

const STRATEGIES: { value: SectionStrategy; label: string; description: string }[] = [
  { value: 'MAINTAIN_STREAM', label: 'Maintain Stream', description: 'Keep students in the same lettered/named stream (e.g. Gold → Gold).' },
  { value: 'AUTO_DISTRIBUTE', label: 'Auto Distribute', description: 'Balance students evenly across the target classes.' },
  { value: 'UNASSIGNED_POOL', label: 'Unassigned Pool', description: "Leave section assignment for an admin to do manually afterward." },
];

export function PromotionRunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: run, isLoading } = useQuery({
    queryKey: ['promotion-runs', id],
    queryFn: () => apiFetch<PromotionRun>(`/promotion-runs/${id}`),
    enabled: !!id,
  });

  const { data: gradeLevels } = useQuery({
    queryKey: ['grade-levels'],
    queryFn: () => apiFetch<GradeLevel[]>('/grade-levels'),
  });

  const [strategy, setStrategy] = useState<SectionStrategy>('MAINTAIN_STREAM');

  const overrideResult = useMutation({
    mutationFn: ({ resultId, decision, targetGradeLevelId }: { resultId: string; decision?: PromotionDecision; targetGradeLevelId?: string | null }) =>
      apiFetch<PromotionResultItem>(`/promotion-runs/${id}/results/${resultId}`, {
        method: 'PATCH',
        body: JSON.stringify({ decision, targetGradeLevelId }),
      }),
    onSuccess: () => {
      toast.success('Result updated.');
      queryClient.invalidateQueries({ queryKey: ['promotion-runs', id] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not update result.')),
  });

  const executeRun = useMutation({
    mutationFn: () =>
      apiFetch<PromotionRun>(`/promotion-runs/${id}/execute`, {
        method: 'POST',
        body: JSON.stringify({ sectionStrategy: strategy }),
      }),
    onSuccess: () => {
      toast.success('Promotion executed — students have been moved into their new classes.');
      queryClient.invalidateQueries({ queryKey: ['promotion-runs', id] });
      queryClient.invalidateQueries({ queryKey: ['promotion-runs'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not execute promotion run.')),
  });

  if (isLoading || !run) {
    return (
      <DashboardLayout title="Promotion Run" icon={TrendingUp}>
        <p className="text-sm text-zinc-500">Loading…</p>
      </DashboardLayout>
    );
  }

  const isDraft = run.status === 'DRAFT';
  const results = run.results ?? [];
  const summary = results.reduce<Record<PromotionDecision, number>>(
    (acc, r) => {
      acc[r.decision] = (acc[r.decision] ?? 0) + 1;
      return acc;
    },
    { PROMOTED: 0, PROBATION: 0, REPEATED: 0, GRADUATED: 0 },
  );

  return (
    <DashboardLayout title="Promotion Run" icon={TrendingUp}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <button onClick={() => navigate('/promotion-runs')} className="mb-1 text-xs font-medium text-primary-700 hover:underline">
            ← All runs
          </button>
          <h2 className="text-lg font-semibold text-zinc-900">
            {run.fromAcademicYear.name} → {run.toAcademicYear.name}
          </h2>
          <p className="text-sm text-zinc-500">
            {results.length} student(s) ·{' '}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                run.status === 'EXECUTED' ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'
              }`}
            >
              {run.status}
            </span>
          </p>
        </div>

        <div className="flex gap-2 text-xs">
          {DECISIONS.map((d) => (
            <span key={d} className={`rounded-full px-2 py-1 font-medium ${DECISION_STYLES[d]}`}>
              {d}: {summary[d]}
            </span>
          ))}
        </div>
      </div>

      {isDraft && (
        <div className="mb-6 max-w-6xl rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-zinc-800">Execute this run</h3>
          <p className="mb-4 text-sm text-zinc-500">
            Choose how students should be distributed across sections in the target academic year, then execute. This
            moves every student's active enrollment and cannot be undone through the app.
          </p>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {STRATEGIES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStrategy(s.value)}
                className={cn(
                  'rounded-lg border p-3 text-left text-sm transition-colors',
                  strategy === s.value ? 'border-primary-600 bg-primary-50' : 'border-border hover:bg-zinc-50',
                )}
              >
                <div className="font-medium text-zinc-900">{s.label}</div>
                <div className="mt-1 text-xs text-zinc-500">{s.description}</div>
              </button>
            ))}
          </div>
          <Button
            loading={executeRun.isPending}
            onClick={() => {
              if (window.confirm('Execute this promotion run? Students will be moved into their new classes.')) {
                executeRun.mutate();
              }
            }}
          >
            Execute Promotion
          </Button>
        </div>
      )}

      <div className="max-w-6xl overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-[11px] uppercase tracking-wide text-zinc-400">
              <tr>
                <th className="px-6 py-3 font-semibold">Student</th>
                <th className="px-6 py-3 font-semibold">From Class</th>
                <th className="px-6 py-3 font-semibold">Average</th>
                <th className="px-6 py-3 font-semibold">Decision</th>
                <th className="px-6 py-3 font-semibold">{isDraft ? 'Target Grade' : 'To Class'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {results.map((r) => (
                <tr key={r.id}>
                  <td className="px-6 py-3 text-zinc-900">
                    {formatName(r.student.user.firstName, r.student.user.lastName)}
                    <span className="ml-1 text-xs text-zinc-400">{r.student.admissionNumber}</span>
                  </td>
                  <td className="px-6 py-3 text-zinc-500">{titleCase(r.fromClass.name)}</td>
                  <td className="px-6 py-3 tabular-nums text-zinc-500">{Number(r.cumulativeAverage).toFixed(1)}</td>
                  <td className="px-6 py-3">
                    {isDraft ? (
                      <div className="w-36">
                        <Select
                          fieldSize="sm"
                          value={r.decision}
                          onValueChange={(v) => overrideResult.mutate({ resultId: r.id, decision: v as PromotionDecision })}
                          options={DECISIONS.map((d) => ({ value: d, label: d }))}
                        />
                      </div>
                    ) : (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DECISION_STYLES[r.decision]}`}>
                        {r.decision}
                      </span>
                    )}
                    {r.decisionOverridden && <span className="ml-2 text-xs text-zinc-400">(overridden)</span>}
                  </td>
                  <td className="px-6 py-3 text-zinc-500">
                    {isDraft ? (
                      <div className="w-44">
                        <Select
                          fieldSize="sm"
                          value={r.targetGradeLevelId ?? GRADUATES}
                          onValueChange={(v) =>
                            overrideResult.mutate({ resultId: r.id, targetGradeLevelId: v === GRADUATES ? null : v })
                          }
                          options={[
                            { value: GRADUATES, label: '— Graduates / leaves —' },
                            ...(gradeLevels ?? []).map((gl) => ({ value: gl.id, label: gl.name })),
                          ]}
                        />
                      </div>
                    ) : (
                      titleCase(r.toClass?.name ?? '— Unassigned —')
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 max-w-5xl text-xs text-zinc-500">
        <Link to="/promotion-setup" className="text-primary-700 hover:underline">
          Adjust grade levels or promotion thresholds
        </Link>{' '}
        if these results don't look right, then discard and recompute this run.
      </p>
    </DashboardLayout>
  );
}
