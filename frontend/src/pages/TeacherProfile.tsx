import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Users } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Avatar } from '../components/Avatar';
import { StatCard } from '../components/StatCard';
import { apiFetch, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { BriefcaseIcon, MailIcon, PhoneIcon, UsersIcon } from '../components/icons';
import { formatName, titleCase } from '../utils/format';
import {
  DEPARTMENTS,
  DEPARTMENT_LABELS,
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_STATUS_LABELS,
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
} from '../constants';
import type { AcademicYear, ClassItem, ContractType, Department, EmploymentStatus, TeacherDetail } from '../types';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function TeacherProfilePage() {
  const { id: routeId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const id = routeId ?? 'me';

  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacher', id],
    queryFn: () => apiFetch<TeacherDetail>(`/teachers/${id}`),
  });

  const noClassAssigned = !!teacher && teacher.assignedClasses.length === 0;

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => apiFetch<AcademicYear[]>('/academic-years'),
    enabled: canManage && noClassAssigned,
  });
  const currentYearId = academicYears?.find((y) => y.isCurrent)?.id ?? academicYears?.[0]?.id;

  // Scoped to the current academic year — a teacher can be the form
  // teacher of one class per year, and assigning them into a past year's
  // (now-historical) empty class wouldn't make sense.
  const { data: currentYearClasses } = useQuery({
    queryKey: ['classes', currentYearId],
    queryFn: () => apiFetch<ClassItem[]>(`/classes?academicYearId=${currentYearId}`),
    enabled: canManage && noClassAssigned && !!currentYearId,
  });
  const unassignedClasses = currentYearClasses?.filter((c) => !c.formTeacher) ?? [];

  const [selectedClassId, setSelectedClassId] = useState('');

  const assignClass = useMutation({
    mutationFn: () =>
      apiFetch(`/classes/${selectedClassId}`, {
        method: 'PATCH',
        body: JSON.stringify({ formTeacherId: teacher?.id }),
      }),
    onSuccess: () => {
      toast.success('Class assigned.');
      setSelectedClassId('');
      queryClient.invalidateQueries({ queryKey: ['teacher', id] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not assign class.')),
  });

  const [editing, setEditing] = useState(false);
  const [department, setDepartment] = useState<Department | ''>('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus | ''>('');
  const [qualification, setQualification] = useState('');
  const [contractType, setContractType] = useState<ContractType | ''>('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [ssnitNumber, setSsnitNumber] = useState('');

  function openEdit() {
    if (!teacher) return;
    setDepartment(teacher.department ?? '');
    setPhone(teacher.phone ?? '');
    setEmail(teacher.email ?? '');
    setEmploymentStatus(teacher.employmentStatus ?? '');
    setQualification(teacher.qualification ?? '');
    setContractType(teacher.contractType ?? '');
    setBankName(teacher.bankName ?? '');
    setBankAccountNumber(teacher.bankAccountNumber ?? '');
    setSsnitNumber(teacher.ssnitNumber ?? '');
    setEditing(true);
  }

  useEffect(() => {
    if (teacher && canManage && searchParams.get('edit') === '1') {
      openEdit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacher, canManage]);

  const saveTeacher = useMutation({
    mutationFn: () =>
      apiFetch<TeacherDetail>(`/teachers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          department: department || null,
          phone: phone || null,
          email: email || null,
          employmentStatus: employmentStatus || null,
          qualification: qualification || null,
          contractType: contractType || null,
          bankName: bankName || null,
          bankAccountNumber: bankAccountNumber || null,
          ssnitNumber: ssnitNumber || null,
        }),
      }),
    onSuccess: () => {
      toast.success('Profile updated.');
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['teacher', id] });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not update profile.')),
  });

  const [newPassword, setNewPassword] = useState<string | null>(null);
  const resetPassword = useMutation({
    mutationFn: () => apiFetch<{ generatedPassword: string }>(`/teachers/${id}/reset-password`, { method: 'POST' }),
    onSuccess: (data) => setNewPassword(data.generatedPassword),
    onError: (error) => toast.error(errorMessage(error, 'Could not reset password.')),
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Teacher Profile" icon={Users}>
        <p className="text-sm text-zinc-500">Loading…</p>
      </DashboardLayout>
    );
  }

  if (!teacher) {
    return (
      <DashboardLayout title="Teacher Profile" icon={Users}>
        <p className="text-sm text-zinc-500">Teacher not found.</p>
      </DashboardLayout>
    );
  }

  const fullName = formatName(teacher.firstName, teacher.lastName);

  return (
    <DashboardLayout title="Teacher Profile" icon={Users}>
      {canManage && (
        <Link to="/teachers" className="mb-4 inline-block text-sm text-primary-700 hover:underline">
          ← Back to Teachers
        </Link>
      )}

      <div className="max-w-6xl">
        <div className="mb-6 flex flex-col items-center gap-5 rounded-xl border border-border bg-surface p-6 shadow-sm sm:flex-row sm:items-start">
          <Avatar name={fullName} size="lg" />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl font-semibold text-zinc-900">{fullName}</h1>
            <p className="text-sm text-zinc-500">
              {teacher.employeeId} · {teacher.username}
            </p>
            <div className="mt-3 flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <span className="inline-flex items-center gap-1.5 text-sm text-zinc-700">
                <PhoneIcon className="h-4 w-4 text-zinc-400" />
                {teacher.phone ?? 'No phone on file'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm text-zinc-700">
                <MailIcon className="h-4 w-4 text-zinc-400" />
                {teacher.email ?? 'No email on file'}
              </span>
            </div>
          </div>
          {canManage && (
            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" loading={resetPassword.isPending} onClick={() => resetPassword.mutate()}>
                Reset Password
              </Button>
              <Button onClick={() => (editing ? setEditing(false) : openEdit())}>
                {editing ? 'Cancel' : 'Edit profile'}
              </Button>
            </div>
          )}
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

        {!editing && (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                icon={UsersIcon}
                value={teacher.totalStudents}
                label="Total Students"
                colorKey="stat-population"
                subtext={
                  teacher.assignedClasses.length > 0
                    ? teacher.assignedClasses.map((c) => titleCase(c.name)).join(', ')
                    : 'No class assigned'
                }
              />
              <StatCard
                icon={BriefcaseIcon}
                value={teacher.department ? DEPARTMENT_LABELS[teacher.department] : 'Not set'}
                label="Department"
                colorKey="stat-staff"
                subtext={teacher.employmentStatus ? EMPLOYMENT_STATUS_LABELS[teacher.employmentStatus] : undefined}
              />
              <StatCard
                icon={PhoneIcon}
                value={teacher.phone ?? 'Not provided'}
                label="Active Phone Number"
                colorKey="stat-fees"
                subtext={teacher.email ?? 'No email on file'}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
                <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Core Profile</h2>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-zinc-500">Department</dt>
                    <dd className="text-zinc-900">
                      {teacher.department ? DEPARTMENT_LABELS[teacher.department] : 'Not set'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Employment Status</dt>
                    <dd className="text-zinc-900">
                      {teacher.employmentStatus ? EMPLOYMENT_STATUS_LABELS[teacher.employmentStatus] : 'Not set'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Phone Number</dt>
                    <dd className="text-zinc-900">{teacher.phone ?? 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Email</dt>
                    <dd className="text-zinc-900">{teacher.email ?? 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Assigned Class</dt>
                    {teacher.assignedClasses.length > 0 ? (
                      <dd className="text-zinc-900">
                        {teacher.assignedClasses
                          .map((c) => `${titleCase(c.name)} (${c.studentCount} students)`)
                          .join(', ')}
                      </dd>
                    ) : canManage ? (
                      <dd className="mt-1 flex items-center gap-2">
                        {unassignedClasses.length > 0 ? (
                          <>
                            <div className="w-44">
                              <Select
                                fieldSize="sm"
                                placeholder="Select a class"
                                value={selectedClassId || undefined}
                                onValueChange={setSelectedClassId}
                                options={unassignedClasses.map((c) => ({ value: c.id, label: titleCase(c.name) }))}
                              />
                            </div>
                            <Button size="sm" disabled={!selectedClassId} loading={assignClass.isPending} onClick={() => assignClass.mutate()}>
                              Assign
                            </Button>
                          </>
                        ) : (
                          <span className="text-zinc-500">No unassigned classes available.</span>
                        )}
                      </dd>
                    ) : (
                      <dd className="text-zinc-900">Not assigned</dd>
                    )}
                  </div>
                </dl>
              </div>

              <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
                <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Employment &amp; Banking
                </h2>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-zinc-500">Qualifications</dt>
                    <dd className="text-zinc-900">{teacher.qualification ?? 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Date of Joining</dt>
                    <dd className="text-zinc-900">{new Date(teacher.hiredAt).toLocaleDateString()}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Contract Type</dt>
                    <dd className="text-zinc-900">
                      {teacher.contractType ? CONTRACT_TYPE_LABELS[teacher.contractType] : 'Not set'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Bank Account Details</dt>
                    <dd className="text-zinc-900">
                      {teacher.bankName || teacher.bankAccountNumber
                        ? `${teacher.bankName ?? 'Not provided'} · ${teacher.bankAccountNumber ?? 'Not provided'}`
                        : 'Not provided'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">SSNIT Number</dt>
                    <dd className="text-zinc-900">{teacher.ssnitNumber ?? 'Not provided'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </>
        )}

        {editing && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveTeacher.mutate();
            }}
            className="rounded-xl border border-border bg-surface p-6 shadow-sm"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Department"
                placeholder="—"
                value={department || undefined}
                onValueChange={(v) => setDepartment(v as Department)}
                options={DEPARTMENTS.map((d) => ({ value: d, label: DEPARTMENT_LABELS[d] }))}
              />
              <Select
                label="Employment Status"
                placeholder="—"
                value={employmentStatus || undefined}
                onValueChange={(v) => setEmploymentStatus(v as EmploymentStatus)}
                options={EMPLOYMENT_STATUSES.map((s) => ({ value: s, label: EMPLOYMENT_STATUS_LABELS[s] }))}
              />
              <Input
                type="tel"
                label="Active Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                pattern="0[2-5][0-9]{8}"
                title="Enter a valid 10-digit Ghanaian phone number, e.g. 0501234567"
                placeholder="0501234567"
              />
              <Input
                type="email"
                label="Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@example.com"
              />
              <Select
                label="Contract Type"
                placeholder="—"
                value={contractType || undefined}
                onValueChange={(v) => setContractType(v as ContractType)}
                options={CONTRACT_TYPES.map((c) => ({ value: c, label: CONTRACT_TYPE_LABELS[c] }))}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Qualifications & Degrees"
                  placeholder="e.g. B.Ed Mathematics"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                />
              </div>
              <Input label="Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
              <Input label="Bank Account Number" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} />
              <Input label="SSNIT Number" value={ssnitNumber} onChange={(e) => setSsnitNumber(e.target.value)} />
            </div>

            <Button type="submit" loading={saveTeacher.isPending} className="mt-4">
              Save changes
            </Button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
