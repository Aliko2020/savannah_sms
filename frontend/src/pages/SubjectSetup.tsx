import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { BookOpen, Plus } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Checkbox } from '../components/ui/Checkbox';
import { apiFetch, ApiError } from '../api/client';
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

  const loadStandardSubjects = useMutation({
    mutationFn: () => apiFetch<{ message: string; count: number }>('/subjects/load-standard', { method: 'POST' }),
    onSuccess: (data) => {
      toast.success(data.count > 0 ? data.message : 'Already up to date — no new subjects to add.');
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not load standard subjects.')),
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
    <DashboardLayout title="Subject Setup" icon={BookOpen}>
      <div className="max-w-3xl">
        <div className="mb-4 flex items-center justify-end gap-3">
          <Button variant="secondary" loading={loadStandardSubjects.isPending} onClick={() => loadStandardSubjects.mutate()}>
            Load standard subjects
          </Button>
          <Button onClick={() => (showForm ? closeForm() : openAddForm())}>
            {showForm ? 'Cancel' : (
              <>
                <Plus /> Add subject
              </>
            )}
          </Button>
        </div>

        {showForm && (
          <div className="mb-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900">
              {editingSubject ? `Edit ${editingSubject.name}` : 'Add subject'}
            </h2>

            <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
              <Input label="Name" required placeholder="e.g. Mathematics" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Code" required placeholder="e.g. MATH" value={code} onChange={(e) => setCode(e.target.value)} />
              <div className="col-span-2">
                <label className="mb-1.5 block text-[13px] font-medium text-zinc-700">
                  Category <span className="text-danger-600">*</span>
                </label>
                <div className="flex flex-wrap gap-5">
                  {CLASS_CATEGORIES.map((c) => (
                    <Checkbox
                      key={c}
                      checked={categories.includes(c)}
                      onCheckedChange={() => toggleCategory(c)}
                      label={CLASS_CATEGORY_LABELS[c]}
                    />
                  ))}
                </div>
                {categories.length === 0 && (
                  <p className="mt-1.5 text-xs text-danger-600">Select at least one category.</p>
                )}
              </div>
              <Button type="submit" loading={saveSubject.isPending} disabled={categories.length === 0} className="col-span-2 max-w-40">
                {editingSubject ? 'Save changes' : 'Add subject'}
              </Button>
            </form>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          {!isLoading && subjects && subjects.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-zinc-500">No subjects yet.</p>
          )}

          {!isLoading && subjects && subjects.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-[11px] uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-6 py-3 font-semibold">#</th>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Code</th>
                  <th className="px-6 py-3 font-semibold">Category</th>
                  <th className="px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subjects.map((s, index) => (
                  <tr key={s.id} className="transition-colors hover:bg-zinc-50">
                    <td className="px-6 py-3 tabular-nums text-zinc-400">{index + 1}</td>
                    <td className="px-6 py-3 text-zinc-900">{s.name}</td>
                    <td className="px-6 py-3 text-zinc-500">{s.code}</td>
                    <td className="px-6 py-3 text-zinc-500">
                      {s.categories.map((c) => CLASS_CATEGORY_LABELS[c]).join(', ')}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEditForm(s)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                          disabled={deleteSubject.isPending}
                          onClick={() => handleDelete(s)}
                        >
                          Delete
                        </Button>
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
