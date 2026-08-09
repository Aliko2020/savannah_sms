import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ArrowRight, GitBranch, Plus } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Checkbox } from '../components/ui/Checkbox';
import { apiFetch, ApiError } from '../api/client';
import { CLASS_CATEGORIES, CLASS_CATEGORY_LABELS } from '../constants';
import { titleCase } from '../utils/format';
import type { AcademicYear, ClassCategory, ClassItem, GradeLevel, PromotionRule } from '../types';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

// Radix Select reserves the empty string for "no selection".
const TERMINAL = '__terminal__';

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-900 text-xs font-semibold text-white">
      {n}
    </span>
  );
}

export function PromotionSetupPage() {
  const queryClient = useQueryClient();

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => apiFetch<AcademicYear[]>('/academic-years'),
  });
  const currentYear = academicYears?.find((y) => y.isCurrent) ?? academicYears?.[0];

  // ---- Step 1a: create the next academic session ----
  const [yearName, setYearName] = useState('');
  const [nextYearId, setNextYearId] = useState('');

  const createYear = useMutation({
    mutationFn: () =>
      apiFetch<AcademicYear>('/academic-years', {
        method: 'POST',
        body: JSON.stringify({ name: yearName, isCurrent: false }),
      }),
    onSuccess: (data) => {
      toast.success('Academic session created.');
      setYearName('');
      setNextYearId(data.id);
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not create academic session.')),
  });

  function handleCreateYear(e: FormEvent) {
    e.preventDefault();
    createYear.mutate();
  }

  const candidateNextYears = (academicYears ?? []).filter((y) => y.id !== currentYear?.id);
  useEffect(() => {
    if (!nextYearId && candidateNextYears.length > 0) {
      setNextYearId(candidateNextYears[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateNextYears.length]);

  const nextYear = academicYears?.find((y) => y.id === nextYearId);

  const { data: nextClasses, isLoading: loadingNextClasses } = useQuery({
    queryKey: ['classes', nextYearId],
    queryFn: () => apiFetch<ClassItem[]>(`/classes?academicYearId=${nextYearId}`),
    enabled: !!nextYearId,
  });

  const { data: gradeLevels } = useQuery({
    queryKey: ['grade-levels'],
    queryFn: () => apiFetch<GradeLevel[]>('/grade-levels'),
  });

  // ---- Step 1b: populate next year's class list ----
  const [showAddClass, setShowAddClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassCategory, setNewClassCategory] = useState<ClassCategory>('PRIMARY');
  const [newClassGradeLevelId, setNewClassGradeLevelId] = useState('');

  const addNextClass = useMutation({
    mutationFn: () =>
      apiFetch<ClassItem>('/classes', {
        method: 'POST',
        body: JSON.stringify({
          name: newClassName,
          code: newClassCode,
          category: newClassCategory,
          gradeLevelId: newClassGradeLevelId,
          academicYearId: nextYearId,
        }),
      }),
    onSuccess: () => {
      toast.success('Class added.');
      setNewClassName('');
      setNewClassCode('');
      setNewClassGradeLevelId('');
      queryClient.invalidateQueries({ queryKey: ['classes', nextYearId] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not add class.')),
  });

  function handleAddNextClass(e: FormEvent) {
    e.preventDefault();
    addNextClass.mutate();
  }

  // ---- Step 2: Grade Levels & progression ----
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [newGradeName, setNewGradeName] = useState('');
  const [newGradeCategory, setNewGradeCategory] = useState<ClassCategory>('PRIMARY');
  const [newGradeOrder, setNewGradeOrder] = useState('');

  const addGradeLevel = useMutation({
    mutationFn: () =>
      apiFetch<GradeLevel>('/grade-levels', {
        method: 'POST',
        body: JSON.stringify({ name: newGradeName, category: newGradeCategory, order: Number(newGradeOrder) }),
      }),
    onSuccess: () => {
      toast.success('Grade level added.');
      setNewGradeName('');
      setNewGradeOrder('');
      setShowAddGrade(false);
      queryClient.invalidateQueries({ queryKey: ['grade-levels'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not add grade level.')),
  });

  function handleAddGradeLevel(e: FormEvent) {
    e.preventDefault();
    addGradeLevel.mutate();
  }

  const setPromotesTo = useMutation({
    mutationFn: ({ id, promotesToId }: { id: string; promotesToId: string | null }) =>
      apiFetch<GradeLevel>(`/grade-levels/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ promotesToId }),
      }),
    onSuccess: () => {
      toast.success('Progression saved.');
      queryClient.invalidateQueries({ queryKey: ['grade-levels'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save progression.')),
  });

  const deleteGradeLevel = useMutation({
    mutationFn: (id: string) => apiFetch(`/grade-levels/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Grade level deleted.');
      queryClient.invalidateQueries({ queryKey: ['grade-levels'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not delete grade level.')),
  });

  // ---- Step 3: Promotion Rules ----
  const { data: promotionRules } = useQuery({
    queryKey: ['promotion-rules'],
    queryFn: () => apiFetch<PromotionRule[]>('/promotion-rules'),
  });
  const defaultRule = promotionRules?.find((r) => r.gradeLevelId === null) ?? null;

  const [defaultPromoteMin, setDefaultPromoteMin] = useState('50');
  const [defaultProbationMin, setDefaultProbationMin] = useState('40');
  const [defaultProbationPromotes, setDefaultProbationPromotes] = useState(true);

  useEffect(() => {
    if (defaultRule) {
      setDefaultPromoteMin(String(defaultRule.promoteMinAverage));
      setDefaultProbationMin(String(defaultRule.probationMinAverage));
      setDefaultProbationPromotes(defaultRule.probationPromotes);
    }
  }, [defaultRule?.id]);

  const saveDefaultRule = useMutation({
    mutationFn: () =>
      apiFetch<PromotionRule>('/promotion-rules/default', {
        method: 'PUT',
        body: JSON.stringify({
          promoteMinAverage: Number(defaultPromoteMin),
          probationMinAverage: Number(defaultProbationMin),
          probationPromotes: defaultProbationPromotes,
        }),
      }),
    onSuccess: () => {
      toast.success('Default promotion rule saved.');
      queryClient.invalidateQueries({ queryKey: ['promotion-rules'] });
      queryClient.invalidateQueries({ queryKey: ['grade-levels'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save default rule.')),
  });

  function handleSaveDefaultRule(e: FormEvent) {
    e.preventDefault();
    saveDefaultRule.mutate();
  }

  const [overrideGradeLevelId, setOverrideGradeLevelId] = useState('');
  const [overridePromoteMin, setOverridePromoteMin] = useState('50');
  const [overrideProbationMin, setOverrideProbationMin] = useState('40');
  const [overrideProbationPromotes, setOverrideProbationPromotes] = useState(true);
  const [showOverrideForm, setShowOverrideForm] = useState(false);

  const saveOverrideRule = useMutation({
    mutationFn: () =>
      apiFetch<PromotionRule>(`/promotion-rules/grade-level/${overrideGradeLevelId}`, {
        method: 'PUT',
        body: JSON.stringify({
          promoteMinAverage: Number(overridePromoteMin),
          probationMinAverage: Number(overrideProbationMin),
          probationPromotes: overrideProbationPromotes,
        }),
      }),
    onSuccess: () => {
      toast.success('Grade level override saved.');
      setShowOverrideForm(false);
      setOverrideGradeLevelId('');
      queryClient.invalidateQueries({ queryKey: ['promotion-rules'] });
      queryClient.invalidateQueries({ queryKey: ['grade-levels'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save override.')),
  });

  function handleSaveOverrideRule(e: FormEvent) {
    e.preventDefault();
    saveOverrideRule.mutate();
  }

  const deleteOverrideRule = useMutation({
    mutationFn: (gradeLevelId: string) => apiFetch(`/promotion-rules/grade-level/${gradeLevelId}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Override removed — this grade level now uses the default rule.');
      queryClient.invalidateQueries({ queryKey: ['promotion-rules'] });
      queryClient.invalidateQueries({ queryKey: ['grade-levels'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not remove override.')),
  });

  const overrideRules = (promotionRules ?? []).filter((r) => r.gradeLevelId !== null);

  return (
    <DashboardLayout title="Promotion Setup" icon={GitBranch}>
      <p className="mb-6 max-w-3xl text-sm text-zinc-500">
        Configure the promotion module: create the next academic session, define grade levels and where each one
        progresses to, and set the pass/fail thresholds used when running promotions.{' '}
        <Link to="/promotion-runs" className="font-medium text-primary-700 hover:underline">
          Run a promotion cycle →
        </Link>
      </p>

      <div className="max-w-5xl space-y-8">
        {/* ---- Step 1: Next Academic Session ---- */}
        <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <StepBadge n={1} />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">Next Academic Session</h2>
          </div>

          <form onSubmit={handleCreateYear} className="mb-4 flex flex-wrap items-end gap-3">
            <Input label="Session name" placeholder="2027/2028" value={yearName} onChange={(e) => setYearName(e.target.value)} required />
            <Button type="submit" loading={createYear.isPending}>
              Create Session
            </Button>
          </form>

          {candidateNextYears.length > 0 && (
            <div className="max-w-xs">
              <Select
                label="Next session"
                value={nextYearId}
                onValueChange={setNextYearId}
                options={candidateNextYears.map((y) => ({ value: y.id, label: y.name }))}
              />
            </div>
          )}
        </section>

        {/* ---- Step 2: Next Year's Classes ---- */}
        {nextYearId && (
          <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StepBadge n={2} />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                  {nextYear?.name ?? 'Next Year'}&rsquo;s Classes
                </h2>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setShowAddClass((v) => !v)}>
                {showAddClass ? 'Cancel' : (
                  <>
                    <Plus /> Add class
                  </>
                )}
              </Button>
            </div>

            {showAddClass && (
              <form onSubmit={handleAddNextClass} className="mb-4 grid grid-cols-1 gap-3 rounded-lg bg-zinc-50 p-4 sm:grid-cols-5">
                <Input placeholder="Name, e.g. Grade Two" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} required />
                <Input placeholder="Code, e.g. P2-2027" value={newClassCode} onChange={(e) => setNewClassCode(e.target.value)} required />
                <Select
                  value={newClassCategory}
                  onValueChange={(v) => setNewClassCategory(v as ClassCategory)}
                  options={CLASS_CATEGORIES.map((category) => ({ value: category, label: CLASS_CATEGORY_LABELS[category] }))}
                />
                <Select
                  placeholder="Grade level…"
                  value={newClassGradeLevelId || undefined}
                  onValueChange={setNewClassGradeLevelId}
                  options={(gradeLevels ?? []).map((gl) => ({ value: gl.id, label: gl.name }))}
                  tooltip={
                    gradeLevels && gradeLevels.length === 0
                      ? 'No grade levels exist yet — add one in Step 3 below first.'
                      : undefined
                  }
                />
                <Button type="submit" loading={addNextClass.isPending}>
                  Add
                </Button>
              </form>
            )}

            {!loadingNextClasses && nextClasses && nextClasses.length === 0 && (
              <p className="text-sm text-zinc-500">No classes set up for {nextYear?.name} yet.</p>
            )}

            {!loadingNextClasses && nextClasses && nextClasses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {nextClasses.map((c) => (
                  <span key={c.id} className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700">
                    {titleCase(c.name)}
                    {c.gradeLevel ? <span className="text-zinc-400"> · {c.gradeLevel.name}</span> : null}
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ---- Step 3: Grade Levels & Progression ---- */}
        <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <StepBadge n={3} />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">Grade Levels &amp; Progression</h2>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowAddGrade((v) => !v)}>
              {showAddGrade ? 'Cancel' : (
                <>
                  <Plus /> Add grade level
                </>
              )}
            </Button>
          </div>

          {showAddGrade && (
            <form onSubmit={handleAddGradeLevel} className="grid grid-cols-1 gap-3 border-b border-border bg-zinc-50 p-4 sm:grid-cols-4">
              <Input placeholder="Name, e.g. Grade Three" value={newGradeName} onChange={(e) => setNewGradeName(e.target.value)} required />
              <Select
                value={newGradeCategory}
                onValueChange={(v) => setNewGradeCategory(v as ClassCategory)}
                options={CLASS_CATEGORIES.map((category) => ({ value: category, label: CLASS_CATEGORY_LABELS[category] }))}
              />
              <Input
                type="number"
                placeholder="Order, e.g. 4"
                value={newGradeOrder}
                onChange={(e) => setNewGradeOrder(e.target.value)}
                required
              />
              <Button type="submit" loading={addGradeLevel.isPending}>
                Add
              </Button>
            </form>
          )}

          {(!gradeLevels || gradeLevels.length === 0) && (
            <p className="px-6 py-8 text-center text-sm text-zinc-500">No grade levels yet.</p>
          )}

          {gradeLevels && gradeLevels.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-[11px] uppercase tracking-wide text-zinc-400">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Order</th>
                    <th className="px-6 py-3 font-semibold">Grade Level</th>
                    <th className="px-6 py-3 font-semibold">Classes</th>
                    <th className="px-6 py-3 font-semibold"></th>
                    <th className="px-6 py-3 font-semibold">Promotes To</th>
                    <th className="px-6 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {gradeLevels.map((gl) => (
                    <tr key={gl.id}>
                      <td className="px-6 py-3 tabular-nums text-zinc-400">{gl.order}</td>
                      <td className="px-6 py-3 font-medium text-zinc-900">{gl.name}</td>
                      <td className="px-6 py-3 tabular-nums text-zinc-500">{gl.classCount}</td>
                      <td className="px-6 py-3 text-zinc-300">
                        <ArrowRight className="size-4" />
                      </td>
                      <td className="px-6 py-3">
                        <div className="max-w-xs">
                          <Select
                            value={gl.promotesToId ?? TERMINAL}
                            disabled={setPromotesTo.isPending}
                            onValueChange={(v) => setPromotesTo.mutate({ id: gl.id, promotesToId: v === TERMINAL ? null : v })}
                            options={[
                              { value: TERMINAL, label: '— Terminal (graduates) —' },
                              ...gradeLevels.filter((g) => g.id !== gl.id).map((g) => ({ value: g.id, label: g.name })),
                            ]}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                          onClick={() => {
                            if (gl.classCount > 0) {
                              toast.error('Cannot delete a grade level with classes assigned to it.');
                              return;
                            }
                            if (window.confirm(`Delete grade level "${gl.name}"?`)) {
                              deleteGradeLevel.mutate(gl.id);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ---- Step 4: Promotion Rules ---- */}
        <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <StepBadge n={4} />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">Promotion Rules</h2>
          </div>
          <p className="mb-4 text-sm text-zinc-500">
            A student's cumulative average across the year decides their outcome: at or above the promote threshold
            they're promoted, between the two thresholds they're on probation, below both they repeat the grade.
          </p>

          <div className="mb-6 rounded-lg bg-zinc-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-zinc-800">Default rule (applies to any grade without its own override)</h3>
            <form onSubmit={handleSaveDefaultRule} className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
              <Input
                type="number"
                step="0.01"
                label="Promote at ≥"
                value={defaultPromoteMin}
                onChange={(e) => setDefaultPromoteMin(e.target.value)}
                required
              />
              <Input
                type="number"
                step="0.01"
                label="Probation at ≥"
                value={defaultProbationMin}
                onChange={(e) => setDefaultProbationMin(e.target.value)}
                required
              />
              <div className="pb-2.5">
                <Checkbox
                  checked={defaultProbationPromotes}
                  onCheckedChange={(checked) => setDefaultProbationPromotes(checked === true)}
                  label="Probation still promotes"
                />
              </div>
              <Button type="submit" loading={saveDefaultRule.isPending}>
                {defaultRule ? 'Save changes' : 'Set default rule'}
              </Button>
            </form>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-800">Per-grade overrides</h3>
            <Button variant="secondary" size="sm" onClick={() => setShowOverrideForm((v) => !v)}>
              {showOverrideForm ? 'Cancel' : (
                <>
                  <Plus /> Add override
                </>
              )}
            </Button>
          </div>

          {showOverrideForm && (
            <form onSubmit={handleSaveOverrideRule} className="mb-4 grid grid-cols-1 gap-3 rounded-lg bg-zinc-50 p-4 sm:grid-cols-5 sm:items-end">
              <Select
                placeholder="Grade level…"
                value={overrideGradeLevelId || undefined}
                onValueChange={setOverrideGradeLevelId}
                options={(gradeLevels ?? []).map((gl) => ({ value: gl.id, label: gl.name }))}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Promote at ≥"
                value={overridePromoteMin}
                onChange={(e) => setOverridePromoteMin(e.target.value)}
                required
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Probation at ≥"
                value={overrideProbationMin}
                onChange={(e) => setOverrideProbationMin(e.target.value)}
                required
              />
              <Checkbox
                checked={overrideProbationPromotes}
                onCheckedChange={(checked) => setOverrideProbationPromotes(checked === true)}
                label="Probation promotes"
              />
              <Button type="submit" loading={saveOverrideRule.isPending}>
                Save
              </Button>
            </form>
          )}

          {overrideRules.length === 0 ? (
            <p className="text-sm text-zinc-500">No per-grade overrides — every grade uses the default rule above.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-[11px] uppercase tracking-wide text-zinc-400">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Grade Level</th>
                    <th className="px-4 py-2 font-semibold">Promote at ≥</th>
                    <th className="px-4 py-2 font-semibold">Probation at ≥</th>
                    <th className="px-4 py-2 font-semibold">Probation Promotes</th>
                    <th className="px-4 py-2 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {overrideRules.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2 text-zinc-900">{r.gradeLevel?.name}</td>
                      <td className="px-4 py-2 tabular-nums text-zinc-500">{r.promoteMinAverage}</td>
                      <td className="px-4 py-2 tabular-nums text-zinc-500">{r.probationMinAverage}</td>
                      <td className="px-4 py-2 text-zinc-500">{r.probationPromotes ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                          onClick={() => r.gradeLevelId && deleteOverrideRule.mutate(r.gradeLevelId)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
