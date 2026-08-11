import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, School } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Checkbox } from '../components/ui/Checkbox';
import { apiFetch, ApiError } from '../api/client';
import { CLASS_CATEGORIES, CLASS_CATEGORY_LABELS } from '../constants';
import type { AcademicYear, ClassCategory, ClassItem, GradeLevel, Teacher, Term } from '../types';
import { formatName, titleCase } from '../utils/format';


function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function AcademicSetupPage() {
  const queryClient = useQueryClient();

  const { data: academicYears, isLoading: loadingYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => apiFetch<AcademicYear[]>('/academic-years'),
  });

  const currentYear = academicYears?.find((y) => y.isCurrent) ?? academicYears?.[0];

  // Defaults to whichever year is marked current, but can be switched to any
  // year — e.g. to set up classes and terms for a newly created next year
  // before it becomes current.
  const [selectedYearId, setSelectedYearId] = useState('');
  useEffect(() => {
    if (!selectedYearId && currentYear) {
      setSelectedYearId(currentYear.id);
    }
  }, [currentYear, selectedYearId]);
  const selectedYear = academicYears?.find((y) => y.id === selectedYearId);

  const { data: classes, isLoading: loadingClasses } = useQuery({
    queryKey: ['classes', selectedYearId],
    queryFn: () => apiFetch<ClassItem[]>(`/classes?academicYearId=${selectedYearId}`),
    enabled: !!selectedYearId,
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => apiFetch<Teacher[]>('/teachers'),
  });

  const { data: gradeLevels } = useQuery({
    queryKey: ['grade-levels'],
    queryFn: () => apiFetch<GradeLevel[]>('/grade-levels'),
  });

  const [yearName, setYearName] = useState('');
  const createYear = useMutation({
    mutationFn: () =>
      apiFetch<AcademicYear>('/academic-years', {
        method: 'POST',
        body: JSON.stringify({ name: yearName, isCurrent: true }),
      }),
    onSuccess: () => {
      setYearName('');
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      toast.success('Academic year created.');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not create academic year.')),
  });

  const setCurrentYear = useMutation({
    mutationFn: (id: string) =>
      apiFetch<AcademicYear>(`/academic-years/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isCurrent: true }),
      }),
    onSuccess: () => {
      toast.success('Academic year set as current.');
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not set this academic year as current.')),
  });

  const { data: terms } = useQuery({
    queryKey: ['terms', selectedYearId],
    queryFn: () => apiFetch<Term[]>(`/terms?academicYearId=${selectedYearId}`),
    enabled: !!selectedYearId,
  });

  // Mirrors the Academic Year selector — defaults to whichever term is
  // current for the selected year, purely to show at a glance which term
  // is active (the tables below aren't term-scoped, so this doesn't filter
  // anything yet).
  const [selectedTermId, setSelectedTermId] = useState('');
  useEffect(() => {
    setSelectedTermId('');
  }, [selectedYearId]);
  useEffect(() => {
    if (!selectedTermId && terms && terms.length > 0) {
      setSelectedTermId(terms.find((t) => t.isCurrent)?.id ?? terms[0].id);
    }
  }, [terms, selectedTermId]);

  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [termName, setTermName] = useState('');
  const [termStartDate, setTermStartDate] = useState('');
  const [termEndDate, setTermEndDate] = useState('');
  const [termIsCurrent, setTermIsCurrent] = useState(true);
  const [showTermForm, setShowTermForm] = useState(false);

  function openAddTermForm() {
    setEditingTerm(null);
    setTermName('');
    setTermStartDate('');
    setTermEndDate('');
    setTermIsCurrent(true);
    setShowTermForm(true);
  }

  function openEditTermForm(t: Term) {
    setEditingTerm(t);
    setTermName(t.name);
    setTermStartDate(t.startDate.slice(0, 10));
    setTermEndDate(t.endDate.slice(0, 10));
    setTermIsCurrent(t.isCurrent);
    setShowTermForm(true);
  }

  function closeTermForm() {
    setShowTermForm(false);
    setEditingTerm(null);
  }

  const saveTerm = useMutation({
    mutationFn: () => {
      const payload = {
        name: termName,
        startDate: termStartDate,
        endDate: termEndDate,
        isCurrent: termIsCurrent,
      };

      return editingTerm
        ? apiFetch<Term>(`/terms/${editingTerm.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
        : apiFetch<Term>('/terms', {
            method: 'POST',
            body: JSON.stringify({ ...payload, academicYearId: selectedYearId }),
          });
    },
    onSuccess: () => {
      toast.success(editingTerm ? 'Term updated.' : 'Term created.');
      closeTermForm();
      queryClient.invalidateQueries({ queryKey: ['terms', selectedYearId] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save term.')),
  });

  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [className, setClassName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [classCategory, setClassCategory] = useState<ClassCategory>('PRIMARY');
  const [formTeacherId, setFormTeacherId] = useState('');
  const [gradeLevelId, setGradeLevelId] = useState('');

  function openAddForm() {
    setEditingClass(null);
    setClassName('');
    setClassCode('');
    setClassCategory('PRIMARY');
    setFormTeacherId('');
    setGradeLevelId('');
    setShowForm(true);
  }

  function openEditForm(c: ClassItem) {
    setEditingClass(c);
    setClassName(c.name);
    setClassCode(c.code);
    setClassCategory(c.category);
    setFormTeacherId(c.formTeacher?.id ?? '');
    setGradeLevelId(c.gradeLevelId);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingClass(null);
  }

  const saveClass = useMutation({
    mutationFn: () => {
      const payload = {
        name: className,
        code: classCode,
        category: classCategory,
        formTeacherId: formTeacherId || undefined,
        gradeLevelId: gradeLevelId || undefined,
      };

      return editingClass
        ? apiFetch<ClassItem>(`/classes/${editingClass.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
        : apiFetch<ClassItem>('/classes', {
            method: 'POST',
            body: JSON.stringify({ ...payload, academicYearId: selectedYearId }),
          });
    },
    onSuccess: () => {
      toast.success(editingClass ? 'Class updated.' : 'Class added.');
      closeForm();
      queryClient.invalidateQueries({ queryKey: ['classes', selectedYearId] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save class.')),
  });

  const deleteClass = useMutation({
    mutationFn: (id: string) => apiFetch(`/classes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Class deleted.');
      queryClient.invalidateQueries({ queryKey: ['classes', selectedYearId] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not delete class.')),
  });

  function handleCreateYear(e: FormEvent) {
    e.preventDefault();
    createYear.mutate();
  }

  function handleSaveClass(e: FormEvent) {
    e.preventDefault();
    saveClass.mutate();
  }

  function handleDelete(c: ClassItem) {
    if (window.confirm(`Delete "${titleCase(c.name)}"? This can't be undone.`)) {
      deleteClass.mutate(c.id);
    }
  }

  function handleSaveTerm(e: FormEvent) {
    e.preventDefault();
    saveTerm.mutate();
  }

  // A teacher can be the class teacher of at most one class PER ACADEMIC
  // YEAR — scoped to `classes` (already filtered to selectedYearId) so a
  // teacher who was a form teacher in a past academic year is still
  // available here once that year's classes are history.
  const assignedTeacherIds = new Set(
    (classes ?? [])
      .filter((c) => c.formTeacher && c.id !== editingClass?.id)
      .map((c) => c.formTeacher!.id),
  );
  const availableTeachers = (teachers ?? []).filter((t) => !assignedTeacherIds.has(t.id));

  return (
    <DashboardLayout title="Class Setup" icon={School}>
      {!loadingYears && !currentYear && (
        <div className="max-w-md rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">Create the current academic year</h2>
          <p className="mb-4 text-sm text-zinc-600">
            Classes are grouped under an academic year (e.g. "2025/2026"). Create one to start adding classes.
          </p>
          <form onSubmit={handleCreateYear} className="flex items-end gap-2">
            <Input
              containerClassName="flex-1"
              label="Name"
              required
              placeholder="2025/2026"
              value={yearName}
              onChange={(e) => setYearName(e.target.value)}
            />
            <Button type="submit" loading={createYear.isPending}>
              Create
            </Button>
          </form>
        </div>
      )}

      {selectedYear && (
        <div className="max-w-7xl">
          <div className="mb-6 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <label className="text-sm text-zinc-600">Academic Year</label>
              <div className="w-48">
                <Select
                  value={selectedYearId}
                  onValueChange={setSelectedYearId}
                  options={(academicYears ?? []).map((y) => ({
                    value: y.id,
                    label: y.isCurrent ? `${y.name} (Current)` : y.name,
                  }))}
                />
              </div>
              {selectedYear && !selectedYear.isCurrent && (
                <Button
                  variant="secondary"
                  size="sm"
                  loading={setCurrentYear.isPending}
                  onClick={() => setCurrentYear.mutate(selectedYear.id)}
                >
                  Set as current year
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-zinc-600">Academic Term</label>
              <div className="w-48">
                <Select
                  value={selectedTermId || undefined}
                  onValueChange={setSelectedTermId}
                  placeholder="Select a term"
                  disabled={!terms || terms.length === 0}
                  options={(terms ?? []).map((t) => ({
                    value: t.id,
                    label: t.isCurrent ? `${t.name} (Current)` : t.name,
                  }))}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Terms</h2>
            {(showTermForm || (terms?.length ?? 0) < 3) && (
              <Button onClick={() => (showTermForm ? closeTermForm() : openAddTermForm())}>
                {showTermForm ? 'Cancel' : (
                  <>
                    <Plus /> Add term
                  </>
                )}
              </Button>
            )}
          </div>

          {!showTermForm && (terms?.length ?? 0) >= 3 && (
            <p className="mt-2 text-xs text-zinc-500">An academic year can have at most 3 terms.</p>
          )}

          {showTermForm && (
            <div className="mt-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-zinc-900">{editingTerm ? `Edit ${editingTerm.name}` : 'Add term'}</h2>
              <form onSubmit={handleSaveTerm} className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Input
                    label="Name"
                    required
                    placeholder="e.g. First Term"
                    value={termName}
                    onChange={(e) => setTermName(e.target.value)}
                  />
                </div>
                <Input
                  type="date"
                  label="Start Date"
                  required
                  value={termStartDate}
                  onChange={(e) => setTermStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  label="End Date"
                  required
                  value={termEndDate}
                  onChange={(e) => setTermEndDate(e.target.value)}
                />
                <div className="col-span-2">
                  <Checkbox
                    checked={termIsCurrent}
                    onCheckedChange={(checked) => setTermIsCurrent(checked === true)}
                    label="Set as current term"
                  />
                </div>
                <Button type="submit" loading={saveTerm.isPending} className="col-span-2 max-w-40">
                  {editingTerm ? 'Save changes' : 'Add term'}
                </Button>
              </form>
            </div>
          )}

          <div className="mt-4 mb-8 overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            {(!terms || terms.length === 0) && (
              <p className="px-6 py-8 text-center text-sm text-zinc-500">No terms set up yet.</p>
            )}
            {terms && terms.length > 0 && (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-[11px] uppercase tracking-wide text-zinc-400">
                  <tr>
                    <th className="px-6 py-3 font-semibold">#</th>
                    <th className="px-6 py-3 font-semibold">Name</th>
                    <th className="px-6 py-3 font-semibold">Start Date</th>
                    <th className="px-6 py-3 font-semibold">End Date</th>
                    <th className="px-6 py-3 font-semibold">Current</th>
                    <th className="px-6 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {terms.map((t, index) => (
                    <tr key={t.id} className="transition-colors hover:bg-zinc-50">
                      <td className="px-6 py-3 tabular-nums text-zinc-400">{index + 1}</td>
                      <td className="px-6 py-3 text-zinc-900">{t.name}</td>
                      <td className="px-6 py-3 text-zinc-500">{new Date(t.startDate).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-zinc-500">{new Date(t.endDate).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-zinc-500">{t.isCurrent ? 'Yes' : '—'}</td>
                      <td className="px-6 py-3">
                        <Button size="sm" variant="ghost" onClick={() => openEditTermForm(t)}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Classes</h2>
            <Button onClick={() => (showForm ? closeForm() : openAddForm())}>
              {showForm ? 'Cancel' : (
                <>
                  <Plus /> Add class
                </>
              )}
            </Button>
          </div>

          {showForm && (
            <div className="mb-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-zinc-900">
                {editingClass ? `Edit ${titleCase(editingClass.name)}` : 'Add class'}
              </h2>

              <form onSubmit={handleSaveClass} className="grid grid-cols-2 gap-4">
                <Input
                  label="Name"
                  required
                  placeholder="e.g. Grade 7 Gold"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
                <Input
                  label="Code"
                  required
                  placeholder="e.g. G7-GOLD"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                />
                <Select
                  label="Category"
                  value={classCategory}
                  onValueChange={(v) => setClassCategory(v as ClassCategory)}
                  options={CLASS_CATEGORIES.map((category) => ({ value: category, label: CLASS_CATEGORY_LABELS[category] }))}
                />
                <Select
                  label="Grade Level"
                  required
                  placeholder="Select a grade level"
                  value={gradeLevelId || undefined}
                  onValueChange={setGradeLevelId}
                  options={(gradeLevels ?? []).map((gl) => ({ value: gl.id, label: gl.name }))}
                  tooltip={
                    gradeLevels && gradeLevels.length === 0
                      ? 'Grade levels need to be created first — set one up on Promotion Setup.'
                      : undefined
                  }
                />
                {gradeLevels && gradeLevels.length === 0 && (
                  <p className="-mt-3 text-xs text-zinc-500">
                    No grade levels yet — create one on the{' '}
                    <Link to="/promotion-setup" className="text-primary-700 hover:underline">
                      Promotion Setup
                    </Link>{' '}
                    page first.
                  </p>
                )}
                <div className="col-span-2">
                  <Select
                    label="Class teacher"
                    placeholder="Select a class teacher"
                    value={formTeacherId || undefined}
                    onValueChange={setFormTeacherId}
                    options={availableTeachers.map((t) => ({ value: t.id, label: formatName(t.firstName, t.lastName) }))}
                    hint={
                      teachers && availableTeachers.length === 0
                        ? 'Every teacher is already assigned to a class. Unassign one first to reassign them.'
                        : undefined
                    }
                  />
                </div>
                <Button type="submit" loading={saveClass.isPending} className="col-span-2 max-w-40">
                  {editingClass ? 'Save changes' : 'Add class'}
                </Button>
              </form>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            {!loadingClasses && classes && classes.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-zinc-500">No classes yet.</p>
            )}

            {!loadingClasses && classes && classes.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-[11px] uppercase tracking-wide text-zinc-400">
                    <tr>
                      <th className="px-6 py-3 font-semibold">#</th>
                      <th className="px-6 py-3 font-semibold">Name</th>
                      <th className="px-6 py-3 font-semibold">Code</th>
                      <th className="px-6 py-3 font-semibold">Grade Level</th>
                      <th className="px-6 py-3 font-semibold">Category</th>
                      <th className="px-6 py-3 font-semibold">Class Teacher</th>
                      <th className="px-6 py-3 font-semibold">Students</th>
                      <th className="px-6 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {classes.map((c, index) => (
                      <tr key={c.id} className="transition-colors hover:bg-zinc-50">
                        <td className="px-6 py-3 tabular-nums text-zinc-400">{index + 1}</td>
                        <td className="px-6 py-3 text-zinc-900">{titleCase(c.name)}</td>
                        <td className="px-6 py-3 text-zinc-500">{c.code}</td>
                        <td className="px-6 py-3 text-zinc-500">{c.gradeLevel?.name ?? 'Not assigned'}</td>
                        <td className="px-6 py-3 text-zinc-500">{CLASS_CATEGORY_LABELS[c.category]}</td>
                        <td className="px-6 py-3 text-zinc-500">
                          {c.formTeacher ? formatName(c.formTeacher.firstName, c.formTeacher.lastName) : 'Not assigned'}
                        </td>
                        <td className="px-6 py-3 tabular-nums text-zinc-500">{c.studentCount}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1">
                            <Button asChild size="sm" variant="ghost">
                              <Link to={`/classes/${c.id}/subjects`}>Subjects</Link>
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openEditForm(c)}>
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                              disabled={deleteClass.isPending}
                              onClick={() => handleDelete(c)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
