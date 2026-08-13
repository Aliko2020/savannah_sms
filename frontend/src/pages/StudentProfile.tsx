import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { FileText, GraduationCap, Plus } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Checkbox } from '../components/ui/Checkbox';
import { Avatar } from '../components/Avatar';
import { apiFetch, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatName, formatCurrency, titleCase } from '../utils/format';
import { FEE_STATUS_LABELS, FEE_STATUS_PILL_CLASSES, GUARDIAN_RELATIONS, GUARDIAN_RELATION_LABELS } from '../constants';
import { toast } from 'react-toastify';
import type { AcademicYear, GuardianRelation, StudentDetail, StudentFeeDetail, StudentGuardianDetail } from '../types';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

interface GuardianFormState {
  fullName: string;
  phone: string;
  alternatePhone: string;
  email: string;
  address: string;
  occupation: string;
  relation: GuardianRelation;
  isPrimary: boolean;
}

const EMPTY_GUARDIAN_FORM: GuardianFormState = {
  fullName: '',
  phone: '',
  alternatePhone: '',
  email: '',
  address: '',
  occupation: '',
  relation: 'GUARDIAN',
  isPrimary: false,
};

function guardianToForm(g: StudentGuardianDetail): GuardianFormState {
  return {
    fullName: g.fullName,
    phone: g.phone,
    alternatePhone: g.alternatePhone ?? '',
    email: g.email ?? '',
    address: g.address ?? '',
    occupation: g.occupation ?? '',
    relation: g.relation,
    isPrimary: g.isPrimary,
  };
}

function GuardianForm({
  initial,
  submitLabel,
  isSaving,
  onCancel,
  onSubmit,
}: {
  initial: GuardianFormState;
  submitLabel: string;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (form: GuardianFormState) => void;
}) {
  const [form, setForm] = useState<GuardianFormState>(initial);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-3 rounded-lg border border-border bg-zinc-50 p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          required
          label="Full Name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
        />
        <Select
          label="Relation"
          value={form.relation}
          onValueChange={(v) => setForm({ ...form, relation: v as GuardianRelation })}
          options={GUARDIAN_RELATIONS.map((r) => ({ value: r, label: GUARDIAN_RELATION_LABELS[r] }))}
        />
        <Input
          required
          type="tel"
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          pattern="0[2-5][0-9]{8}"
          title="Enter a valid 10-digit Ghanaian phone number, e.g. 0501234567"
          placeholder="0501234567"
        />
        <Input
          type="tel"
          label="Alternate Phone"
          value={form.alternatePhone}
          onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })}
          pattern="0[2-5][0-9]{8}"
          title="Enter a valid 10-digit Ghanaian phone number, e.g. 0501234567"
          placeholder="0501234567"
        />
        <Input
          type="email"
          label="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          required
          label="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <Input
          label="Occupation"
          value={form.occupation}
          onChange={(e) => setForm({ ...form, occupation: e.target.value })}
        />
      </div>

      <Checkbox
        checked={form.isPrimary}
        onCheckedChange={(checked) => setForm({ ...form, isPrimary: checked === true })}
        label="Set as primary guardian"
      />

      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={isSaving}>
          {submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => apiFetch<StudentDetail>(`/students/${id}`),
    enabled: !!id,
  });

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => apiFetch<AcademicYear[]>('/academic-years'),
    enabled: isSuperAdmin,
  });
  const currentYear = academicYears?.find((y) => y.isCurrent) ?? academicYears?.[0];

  const { data: feeSummary } = useQuery({
    queryKey: ['fee-student', id, currentYear?.id],
    queryFn: () => apiFetch<StudentFeeDetail>(`/fees/students/${id}?academicYearId=${currentYear!.id}`),
    enabled: isSuperAdmin && !!id && !!currentYear,
  });

  const addGuardian = useMutation({
    mutationFn: (form: GuardianFormState) =>
      apiFetch(`/students/${id}/guardians`, {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          alternatePhone: form.alternatePhone || null,
          email: form.email || null,
          address: form.address || null,
          occupation: form.occupation || null,
        }),
      }),
    onSuccess: () => {
      toast.success('Guardian added.');
      setAdding(false);
      queryClient.invalidateQueries({ queryKey: ['student', id] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not add guardian.')),
  });

  const updateGuardian = useMutation({
    mutationFn: ({ guardianId, form }: { guardianId: string; form: GuardianFormState }) =>
      apiFetch(`/students/${id}/guardians/${guardianId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...form,
          alternatePhone: form.alternatePhone || null,
          email: form.email || null,
          address: form.address || null,
          occupation: form.occupation || null,
        }),
      }),
    onSuccess: () => {
      toast.success('Guardian updated.');
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['student', id] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not update guardian.')),
  });

  const resetPassword = useMutation({
    mutationFn: () => apiFetch<{ generatedPassword: string }>(`/students/${id}/reset-password`, { method: 'POST' }),
    onSuccess: (data) => setNewPassword(data.generatedPassword),
    onError: (error) => toast.error(errorMessage(error, 'Could not reset password.')),
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Student Profile" icon={GraduationCap}>
        <p className="text-sm text-zinc-500">Loading…</p>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout title="Student Profile" icon={GraduationCap}>
        <p className="text-sm text-zinc-500">Student not found.</p>
      </DashboardLayout>
    );
  }

  const fullName = formatName(student.firstName, student.lastName);

  return (
    <DashboardLayout title="Student Profile" icon={GraduationCap}>
      <Link to="/students" className="mb-4 inline-block text-sm text-primary-700 hover:underline">
        ← Back to Students
      </Link>

      <div className="max-w-7xl">
        <div className="mb-6 flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-6 shadow-sm sm:flex-row sm:items-start">
          <Avatar name={fullName} size="lg" />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl font-semibold text-zinc-900">{fullName}</h1>
            <p className="text-sm text-zinc-500">Admission No: {student.admissionNumber}</p>
            <p className="text-sm text-zinc-500">Username: {student.username}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link to={`/students/${id}/report-card`}>
                <FileText /> Report Card
              </Link>
            </Button>
            {canManage && (
              <Button variant="secondary" loading={resetPassword.isPending} onClick={() => resetPassword.mutate()}>
                Reset Password
              </Button>
            )}
          </div>
        </div>

        {newPassword && (
          <div className="mb-6 rounded-lg border border-success-500/20 bg-success-50 p-4 text-sm text-success-700">
            <p>
              New password: <span className="font-semibold">{newPassword}</span> — share this once and have{' '}
              {fullName} change it after logging in.
            </p>
            <Button size="sm" variant="secondary" className="mt-2" onClick={() => setNewPassword(null)}>
              Dismiss
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Personal Info</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
              <div>
                <dt className="text-xs text-zinc-500">Gender</dt>
                <dd className="mt-0.5 font-medium text-zinc-900">
                  {student.gender === 'MALE' ? 'Male' : student.gender === 'FEMALE' ? 'Female' : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Date of Birth</dt>
                <dd className="mt-0.5 font-medium text-zinc-900">
                  {new Date(student.dateOfBirth).toLocaleDateString()}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-zinc-500">Class</dt>
                <dd className="mt-0.5 font-medium text-zinc-900">
                  {student.class ? titleCase(student.class.name) : '—'}
                </dd>
              </div>

              <div className="col-span-2 border-t border-border pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Prior Schooling</p>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Previous School</dt>
                <dd className="mt-0.5 font-medium text-zinc-900">{student.previousSchool ?? 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Reason for Leaving</dt>
                <dd className="mt-0.5 font-medium text-zinc-900">{student.reasonForLeaving ?? 'Not provided'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-zinc-500">Medical Condition</dt>
                <dd className="mt-0.5 font-medium text-zinc-900">{student.medicalCondition ?? 'Not provided'}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Parent / Guardian</h2>
              {!adding && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingId(null);
                    setAdding(true);
                  }}
                >
                  <Plus /> Add Guardian
                </Button>
              )}
            </div>

            {adding && (
              <div className="mb-4">
                <GuardianForm
                  initial={EMPTY_GUARDIAN_FORM}
                  submitLabel="Add Guardian"
                  isSaving={addGuardian.isPending}
                  onCancel={() => setAdding(false)}
                  onSubmit={(form) => addGuardian.mutate(form)}
                />
              </div>
            )}

            {student.guardians.length === 0 && !adding && (
              <p className="text-sm text-zinc-500">No guardian on file.</p>
            )}

            <div className="space-y-4">
              {student.guardians.map((g) => (
                <div key={g.guardianId} className="border-b border-border pb-4 text-sm last:border-0 last:pb-0">
                  {editingId === g.guardianId ? (
                    <GuardianForm
                      initial={guardianToForm(g)}
                      submitLabel="Save Changes"
                      isSaving={updateGuardian.isPending}
                      onCancel={() => setEditingId(null)}
                      onSubmit={(form) => updateGuardian.mutate({ guardianId: g.guardianId, form })}
                    />
                  ) : (
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="font-medium text-zinc-900">{g.fullName}</span>
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                          {GUARDIAN_RELATION_LABELS[g.relation]}
                        </span>
                        {g.isPrimary && (
                          <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800">
                            Primary
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-auto"
                          onClick={() => {
                            setAdding(false);
                            setEditingId(g.guardianId);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                          <dt className="text-xs text-zinc-500">Phone</dt>
                          <dd className="mt-0.5 text-zinc-900">{g.phone}</dd>
                        </div>
                        {g.alternatePhone && (
                          <div>
                            <dt className="text-xs text-zinc-500">Alternate Phone</dt>
                            <dd className="mt-0.5 text-zinc-900">{g.alternatePhone}</dd>
                          </div>
                        )}
                        {g.email && (
                          <div>
                            <dt className="text-xs text-zinc-500">Email</dt>
                            <dd className="mt-0.5 text-zinc-900">{g.email}</dd>
                          </div>
                        )}
                        <div>
                          <dt className="text-xs text-zinc-500">Address</dt>
                          <dd className="mt-0.5 text-zinc-900">{g.address ?? '—'}</dd>
                        </div>
                        {g.occupation && (
                          <div>
                            <dt className="text-xs text-zinc-500">Occupation</dt>
                            <dd className="mt-0.5 text-zinc-900">{g.occupation}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="mt-6 rounded-xl border border-border bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Fee Summary{currentYear ? ` — ${currentYear.name}` : ''}
              </h2>
              {currentYear && (
                <Link
                  to={`/fees/students/${id}?academicYearId=${currentYear.id}`}
                  className="text-sm font-medium text-primary-700 hover:underline"
                >
                  Manage Payments
                </Link>
              )}
            </div>

            {!feeSummary && <p className="text-sm text-zinc-500">Loading…</p>}

            {feeSummary && feeSummary.expected === null && (
              <p className="text-sm text-zinc-500">
                No fee amount has been configured for this class level and academic year yet.
              </p>
            )}

            {feeSummary && feeSummary.expected !== null && (
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <dt className="text-xs uppercase text-zinc-400">Expected</dt>
                  <dd className="text-lg font-semibold tabular-nums text-zinc-900">{formatCurrency(feeSummary.expected)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-zinc-400">Collected</dt>
                  <dd className="text-lg font-semibold tabular-nums text-zinc-900">{formatCurrency(feeSummary.collected)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-zinc-400">Balance</dt>
                  <dd className="text-lg font-semibold tabular-nums text-zinc-900">
                    {feeSummary.balance !== null ? formatCurrency(feeSummary.balance) : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-zinc-400">Status</dt>
                  <dd>
                    {feeSummary.status && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${FEE_STATUS_PILL_CLASSES[feeSummary.status]}`}
                      >
                        {FEE_STATUS_LABELS[feeSummary.status]}
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
