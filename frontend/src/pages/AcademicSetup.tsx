import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { AppLayout } from '../components/AppLayout';
import { apiFetch, ApiError } from '../api/client';
import { CLASS_CATEGORIES, CLASS_CATEGORY_LABELS } from '../constants';
import type { AcademicYear, ClassCategory, ClassItem, Teacher, Term } from '../types';
import {  LaptopIcon } from '../components/icons';
import { PageHeader } from '../components/PageHeader';
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

  const { data: classes, isLoading: loadingClasses } = useQuery({
    queryKey: ['classes', currentYear?.id],
    queryFn: () => apiFetch<ClassItem[]>(`/classes?academicYearId=${currentYear!.id}`),
    enabled: !!currentYear,
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => apiFetch<Teacher[]>('/teachers'),
  });

  // A teacher can be the class teacher of at most one class, system-wide —
  // fetch every class (not just this academic year) to know who's already taken.
  const { data: allClasses } = useQuery({
    queryKey: ['classes', 'all'],
    queryFn: () => apiFetch<ClassItem[]>('/classes'),
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

  const { data: terms } = useQuery({
    queryKey: ['terms', currentYear?.id],
    queryFn: () => apiFetch<Term[]>(`/terms?academicYearId=${currentYear!.id}`),
    enabled: !!currentYear,
  });

  const [termName, setTermName] = useState('');
  const [termStartDate, setTermStartDate] = useState('');
  const [termEndDate, setTermEndDate] = useState('');
  const [termIsCurrent, setTermIsCurrent] = useState(true);
  const [showTermForm, setShowTermForm] = useState(false);

  const createTerm = useMutation({
    mutationFn: () =>
      apiFetch<Term>('/terms', {
        method: 'POST',
        body: JSON.stringify({
          name: termName,
          academicYearId: currentYear!.id,
          startDate: termStartDate,
          endDate: termEndDate,
          isCurrent: termIsCurrent,
        }),
      }),
    onSuccess: () => {
      toast.success('Term created.');
      setTermName('');
      setTermStartDate('');
      setTermEndDate('');
      setTermIsCurrent(true);
      setShowTermForm(false);
      queryClient.invalidateQueries({ queryKey: ['terms', currentYear?.id] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not create term.')),
  });

  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [className, setClassName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [classCategory, setClassCategory] = useState<ClassCategory>('PRIMARY');
  const [roomNumber, setRoomNumber] = useState('');
  const [formTeacherId, setFormTeacherId] = useState('');

  function openAddForm() {
    setEditingClass(null);
    setClassName('');
    setClassCode('');
    setClassCategory('PRIMARY');
    setRoomNumber('');
    setFormTeacherId('');
    setShowForm(true);
  }

  function openEditForm(c: ClassItem) {
    setEditingClass(c);
    setClassName(c.name);
    setClassCode(c.code);
    setClassCategory(c.category);
    setRoomNumber(c.roomNumber ?? '');
    setFormTeacherId(c.formTeacher?.id ?? '');
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
        roomNumber: roomNumber || undefined,
        formTeacherId: formTeacherId || undefined,
      };

      return editingClass
        ? apiFetch<ClassItem>(`/classes/${editingClass.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
        : apiFetch<ClassItem>('/classes', {
            method: 'POST',
            body: JSON.stringify({ ...payload, academicYearId: currentYear!.id }),
          });
    },
    onSuccess: () => {
      toast.success(editingClass ? 'Class updated.' : 'Class added.');
      closeForm();
      queryClient.invalidateQueries({ queryKey: ['classes', currentYear?.id] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save class.')),
  });

  const deleteClass = useMutation({
    mutationFn: (id: string) => apiFetch(`/classes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Class deleted.');
      queryClient.invalidateQueries({ queryKey: ['classes', currentYear?.id] });
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

  function handleCreateTerm(e: FormEvent) {
    e.preventDefault();
    createTerm.mutate();
  }

  const assignedTeacherIds = new Set(
    (allClasses ?? [])
      .filter((c) => c.formTeacher && c.id !== editingClass?.id)
      .map((c) => c.formTeacher!.id),
  );
  const availableTeachers = (teachers ?? []).filter((t) => !assignedTeacherIds.has(t.id));

  return (
    <AppLayout>
      <PageHeader title='Class Setup' icon={LaptopIcon} />

      {!loadingYears && !currentYear && (
        <div className="max-w-md rounded-lg bg-white p-6 shadow">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Create the current academic year</h2>
          <p className="mb-4 text-sm text-slate-600">
            Classes are grouped under an academic year (e.g. "2025/2026"). Create one to start adding classes.
          </p>
          <form onSubmit={handleCreateYear}>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Name <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
                placeholder="2025/2026"
                value={yearName}
                onChange={(e) => setYearName(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={createYear.isPending}
                className="rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-light disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {currentYear && (
        <div className="max-w-7xl">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Current academic year: <span className="font-medium text-slate-900">{currentYear.name}</span>
            </p>
            <button
              onClick={() => (showForm ? closeForm() : openAddForm())}
              className="rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-light"
            >
              {showForm ? 'Cancel' : '+ Add class'}
            </button>
          </div>

          {showForm && (
            <div className="mb-4 rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">
                {editingClass ? `Edit ${titleCase(editingClass.name)}` : 'Add class'}
              </h2>

              <form onSubmit={handleSaveClass} className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    placeholder="e.g. Grade 7 Gold"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    placeholder="e.g. G7-GOLD"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
                  <select
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    value={classCategory}
                    onChange={(e) => setClassCategory(e.target.value as ClassCategory)}
                  >
                    {CLASS_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {CLASS_CATEGORY_LABELS[category]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Room</label>
                  <input
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Class teacher</label>
                  <select
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    value={formTeacherId}
                    onChange={(e) => setFormTeacherId(e.target.value)}
                  >
                    <option value="">Select a class teacher</option>
                    {availableTeachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {formatName(t.firstName, t.lastName)}
                      </option>
                    ))}
                  </select>
                  {teachers && availableTeachers.length === 0 && (
                    <p className="mt-1 text-xs text-slate-500">
                      Every teacher is already assigned to a class. Unassign one first to reassign them.
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={saveClass.isPending}
                  className="max-w-32 col-span-2 rounded bg-brand py-2 text-sm font-medium text-white hover:bg-brand-light disabled:opacity-50"
                >
                  {saveClass.isPending ? 'Saving…' : editingClass ? 'Save changes' : 'Add class'}
                </button>
              </form>
            </div>
          )}

          <div className="overflow-hidden rounded-lg bg-white shadow">
            {!loadingClasses && classes && classes.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-slate-500">No classes yet.</p>
            )}

            {!loadingClasses && classes && classes.length > 0 && (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-6 py-3 font-semibold">#</th>
                    <th className="px-6 py-3 font-semibold">Name</th>
                    <th className="px-6 py-3 font-semibold">Code</th>
                    <th className="px-6 py-3 font-semibold">Category</th>
                    <th className="px-6 py-3 font-semibold">Room</th>
                    <th className="px-6 py-3 font-semibold">Class Teacher</th>
                    <th className="px-6 py-3 font-semibold">Students</th>
                    <th className="px-6 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classes.map((c, index) => (
                    <tr key={c.id}>
                      <td className="px-6 py-3 text-slate-400">{index + 1}</td>
                      <td className="px-6 py-3 text-slate-900">{titleCase(c.name)}</td>
                      <td className="px-6 py-3 text-slate-500">{c.code}</td>
                      <td className="px-6 py-3 text-slate-500">{CLASS_CATEGORY_LABELS[c.category]}</td>
                      <td className="px-6 py-3 text-slate-500">{c.roomNumber ?? '—'}</td>
                      <td className="px-6 py-3 text-slate-500">
                        {c.formTeacher ? formatName(c.formTeacher.firstName, c.formTeacher.lastName) : '—'}
                      </td>
                      <td className="px-6 py-3 text-slate-500">{c.studentCount}</td>
                      <td className="px-6 py-3">
                        <div className="flex justify-between gap-3">
                          <button
                            onClick={() => openEditForm(c)}
                            className="text-sm font-medium text-brand hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            disabled={deleteClass.isPending}
                            className="text-sm  text-red-500 font-bold  hover:underline disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Terms</h2>
            <button
              onClick={() => setShowTermForm((v) => !v)}
              className="rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-light"
            >
              {showTermForm ? 'Cancel' : '+ Add term'}
            </button>
          </div>

          {showTermForm && (
            <div className="mt-4 rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">Add term</h2>
              <form onSubmit={handleCreateTerm} className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    placeholder="e.g. First Term"
                    value={termName}
                    onChange={(e) => setTermName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    value={termStartDate}
                    onChange={(e) => setTermStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    value={termEndDate}
                    onChange={(e) => setTermEndDate(e.target.value)}
                    required
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="term-is-current"
                    checked={termIsCurrent}
                    onChange={(e) => setTermIsCurrent(e.target.checked)}
                  />
                  <label htmlFor="term-is-current" className="text-sm text-slate-700">
                    Set as current term
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={createTerm.isPending}
                  className="max-w-32 col-span-2 rounded bg-brand py-2 text-sm font-medium text-white hover:bg-brand-light disabled:opacity-50"
                >
                  {createTerm.isPending ? 'Saving…' : 'Add term'}
                </button>
              </form>
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
            {(!terms || terms.length === 0) && (
              <p className="px-6 py-8 text-center text-sm text-slate-500">No terms set up yet.</p>
            )}
            {terms && terms.length > 0 && (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-6 py-3 font-semibold">#</th>
                    <th className="px-6 py-3 font-semibold">Name</th>
                    <th className="px-6 py-3 font-semibold">Start Date</th>
                    <th className="px-6 py-3 font-semibold">End Date</th>
                    <th className="px-6 py-3 font-semibold">Current</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {terms.map((t, index) => (
                    <tr key={t.id}>
                      <td className="px-6 py-3 text-slate-400">{index + 1}</td>
                      <td className="px-6 py-3 text-slate-900">{t.name}</td>
                      <td className="px-6 py-3 text-slate-500">{new Date(t.startDate).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-slate-500">{new Date(t.endDate).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-slate-500">{t.isCurrent ? 'Yes' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
