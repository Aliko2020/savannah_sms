import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { AppLayout } from '../components/AppLayout';
import { apiFetch, ApiError } from '../api/client';
import { BookIcon } from '../components/icons';
import { PageHeader } from '../components/PageHeader';
import { CLASS_CATEGORIES, CLASS_CATEGORY_LABELS } from '../constants';
import type { ClassCategory, Subject } from '../types';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function SubjectSetupPage() {
  const queryClient = useQueryClient();

  const { data: subjects, isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiFetch<Subject[]>('/subjects'),
  });

  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [categories, setCategories] = useState<ClassCategory[]>(['PRIMARY']);

  function openAddForm() {
    setEditingSubject(null);
    setName('');
    setCode('');
    setCategories(['PRIMARY']);
    setShowForm(true);
  }

  function openEditForm(s: Subject) {
    setEditingSubject(s);
    setName(s.name);
    setCode(s.code);
    setCategories(s.categories);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingSubject(null);
  }

  function toggleCategory(c: ClassCategory) {
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  const saveSubject = useMutation({
    mutationFn: () => {
      const payload = { name, code, categories };
      return editingSubject
        ? apiFetch<Subject>(`/subjects/${editingSubject.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
        : apiFetch<Subject>('/subjects', { method: 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      toast.success(editingSubject ? 'Subject updated.' : 'Subject added.');
      closeForm();
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save subject.')),
  });

  const deleteSubject = useMutation({
    mutationFn: (id: string) => apiFetch(`/subjects/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Subject deleted.');
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not delete subject.')),
  });

  function handleSave(e: FormEvent) {
    e.preventDefault();
    saveSubject.mutate();
  }

  function handleDelete(s: Subject) {
    if (window.confirm(`Delete "${s.name}"? This can't be undone.`)) {
      deleteSubject.mutate(s.id);
    }
  }

  return (
    <AppLayout>
      <PageHeader title="Subject Setup" icon={BookIcon} />

      <div className="max-w-3xl">
        <div className="mb-4 flex items-center justify-end">
          <button
            onClick={() => (showForm ? closeForm() : openAddForm())}
            className="rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-light"
          >
            {showForm ? 'Cancel' : '+ Add subject'}
          </button>
        </div>

        {showForm && (
          <div className="mb-4 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
              {editingSubject ? `Edit ${editingSubject.name}` : 'Add subject'}
            </h2>

            <form onSubmit={handleSave} className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  placeholder="e.g. Mathematics"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  placeholder="e.g. MATH"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-4">
                  {CLASS_CATEGORIES.map((c) => (
                    <label key={c} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={categories.includes(c)}
                        onChange={() => toggleCategory(c)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      {CLASS_CATEGORY_LABELS[c]}
                    </label>
                  ))}
                </div>
                {categories.length === 0 && (
                  <p className="mt-1 text-xs text-red-500">Select at least one category.</p>
                )}
              </div>
              <button
                type="submit"
                disabled={saveSubject.isPending || categories.length === 0}
                className="col-span-2 max-w-32 rounded bg-brand py-2 text-sm font-medium text-white hover:bg-brand-light disabled:opacity-50"
              >
                {saveSubject.isPending ? 'Saving…' : editingSubject ? 'Save changes' : 'Add subject'}
              </button>
            </form>
          </div>
        )}

        <div className="overflow-hidden rounded-lg bg-white shadow">
          {!isLoading && subjects && subjects.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-slate-500">No subjects yet.</p>
          )}

          {!isLoading && subjects && subjects.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-6 py-3 font-semibold">#</th>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Code</th>
                  <th className="px-6 py-3 font-semibold">Category</th>
                  <th className="px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((s, index) => (
                  <tr key={s.id}>
                    <td className="px-6 py-3 text-slate-400">{index + 1}</td>
                    <td className="px-6 py-3 text-slate-900">{s.name}</td>
                    <td className="px-6 py-3 text-slate-500">{s.code}</td>
                    <td className="px-6 py-3 text-slate-500">
                      {s.categories.map((c) => CLASS_CATEGORY_LABELS[c]).join(', ')}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEditForm(s)}
                          className="text-sm font-medium text-brand hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          disabled={deleteSubject.isPending}
                          className="text-sm font-bold text-red-500 hover:underline disabled:opacity-50"
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
      </div>
    </AppLayout>
  );
}
