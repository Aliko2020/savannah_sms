import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ArrowRight, Plus, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { apiFetch, ApiError } from '../api/client';
import type { AcademicYear, PromotionRun } from '../types';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function PromotionRunsPage() {
  const queryClient = useQueryClient();

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => apiFetch<AcademicYear[]>('/academic-years'),
  });

  const { data: runs, isLoading } = useQuery({
    queryKey: ['promotion-runs'],
    queryFn: () => apiFetch<PromotionRun[]>('/promotion-runs'),
  });

  const [showForm, setShowForm] = useState(false);
  const [fromAcademicYearId, setFromAcademicYearId] = useState('');
  const [toAcademicYearId, setToAcademicYearId] = useState('');

  const createRun = useMutation({
    mutationFn: () =>
      apiFetch<{ run: PromotionRun; skippedStudentCount: number }>('/promotion-runs', {
        method: 'POST',
        body: JSON.stringify({ fromAcademicYearId, toAcademicYearId }),
      }),
    onSuccess: (data) => {
      toast.success(
        data.skippedStudentCount > 0
          ? `Run created. ${data.skippedStudentCount} student(s) skipped — no scores recorded yet.`
          : 'Promotion run created.',
      );
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['promotion-runs'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not create promotion run.')),
  });

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    createRun.mutate();
  }

  const deleteRun = useMutation({
    mutationFn: (id: string) => apiFetch(`/promotion-runs/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Draft run discarded.');
      queryClient.invalidateQueries({ queryKey: ['promotion-runs'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not discard run.')),
  });

  return (
    <DashboardLayout title="Run Promotion" icon={TrendingUp}>
      <p className="mb-6 max-w-2xl text-xs text-zinc-500">
        Compute promotion outcomes for every enrolled student from one academic year to the next, review or override
        them, then execute to move students into their new classes.{' '}
        <Link to="/promotion-setup" className="font-medium text-primary-700 hover:underline">
          Configure grade levels & rules →
        </Link>
      </p>

      <div className="max-w-5xl">
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : (
              <>
                <Plus /> New promotion run
              </>
            )}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-6 shadow-sm sm:grid-cols-4 sm:items-end">
            <Select
              label="From academic year"
              placeholder="Select…"
              value={fromAcademicYearId || undefined}
              onValueChange={setFromAcademicYearId}
              options={(academicYears ?? []).map((y) => ({ value: y.id, label: y.name }))}
            />
            <Select
              label="To academic year"
              placeholder="Select…"
              value={toAcademicYearId || undefined}
              onValueChange={setToAcademicYearId}
              options={(academicYears ?? []).map((y) => ({ value: y.id, label: y.name }))}
            />
            <Button type="submit" loading={createRun.isPending}>
              Compute results
            </Button>
          </form>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          {!isLoading && runs && runs.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-zinc-500">No promotion runs yet.</p>
          )}
          {runs && runs.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-[11px] uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-6 py-3 font-semibold">From</th>
                  <th className="px-6 py-3 font-semibold"></th>
                  <th className="px-6 py-3 font-semibold">To</th>
                  <th className="px-6 py-3 font-semibold">Students</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Created By</th>
                  <th className="px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td className="px-6 py-3 text-zinc-900">{r.fromAcademicYear.name}</td>
                    <td className="px-6 py-3 text-zinc-300">
                      <ArrowRight className="size-4" />
                    </td>
                    <td className="px-6 py-3 text-zinc-900">{r.toAcademicYear.name}</td>
                    <td className="px-6 py-3 tabular-nums text-zinc-500">{r._count.results}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.status === 'EXECUTED' ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-zinc-500">
                      {r.createdBy.firstName} {r.createdBy.lastName}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1">
                        <Button asChild size="sm" variant="ghost">
                          <Link to={`/promotion-runs/${r.id}`}>{r.status === 'DRAFT' ? 'Review' : 'View'}</Link>
                        </Button>
                        {r.status === 'DRAFT' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                            onClick={() => {
                              if (window.confirm('Discard this draft run?')) deleteRun.mutate(r.id);
                            }}
                          >
                            Discard
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
