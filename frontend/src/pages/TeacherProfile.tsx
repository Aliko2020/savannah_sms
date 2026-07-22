import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { AppLayout } from '../components/AppLayout';
import { PageHeader } from '../components/PageHeader';
import { apiFetch, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { UsersIcon } from '../components/icons';
import { formatName, titleCase } from '../utils/format';
import {
  DEPARTMENTS,
  DEPARTMENT_LABELS,
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_STATUS_LABELS,
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
} from '../constants';
import type { ContractType, Department, EmploymentStatus, TeacherDetail } from '../types';

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

  const [editing, setEditing] = useState(false);
  const [department, setDepartment] = useState<Department | ''>('');
  const [phone, setPhone] = useState('');
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

  if (isLoading) {
    return (
      <AppLayout>
        <PageHeader title="Teacher Profile" icon={UsersIcon} />
        <p className="text-sm text-slate-500">Loading…</p>
      </AppLayout>
    );
  }

  if (!teacher) {
    return (
      <AppLayout>
        <PageHeader title="Teacher Profile" icon={UsersIcon} />
        <p className="text-sm text-slate-500">Teacher not found.</p>
      </AppLayout>
    );
  }

  const fullName = formatName(teacher.firstName, teacher.lastName);

  return (
    <AppLayout>
      <PageHeader title="Teacher Profile" icon={UsersIcon} />

      {canManage && (
        <Link to="/teachers" className="mb-4 inline-block text-sm text-brand hover:underline">
          ← Back to Teachers
        </Link>
      )}

      <div className="max-w-7xl">
        <div className="mb-6 flex flex-col items-center gap-4 rounded-lg bg-white p-6 shadow sm:flex-row sm:items-start">
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl font-semibold text-slate-900">{fullName}</h1>
            <p className="text-sm text-slate-500">Employee ID: {teacher.employeeId}</p>
            <p className="text-sm text-slate-500">Username: {teacher.username}</p>
          </div>
          {canManage && (
            <button
              onClick={() => (editing ? setEditing(false) : openEdit())}
              className="rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-light"
            >
              {editing ? 'Cancel' : 'Edit profile'}
            </button>
          )}
        </div>

        {!editing && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Core Profile</h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-slate-500">Department</dt>
                  <dd className="text-slate-900">
                    {teacher.department ? DEPARTMENT_LABELS[teacher.department] : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Employment Status</dt>
                  <dd className="text-slate-900">
                    {teacher.employmentStatus ? EMPLOYMENT_STATUS_LABELS[teacher.employmentStatus] : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Primary Phone Number</dt>
                  <dd className="text-slate-900">{teacher.phone ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Assigned Class</dt>
                  <dd className="text-slate-900">
                    {teacher.assignedClasses.length > 0
                      ? teacher.assignedClasses.map((c) => titleCase(c.name)).join(', ')
                      : '—'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Credentials
              </h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-slate-500">Qualifications &amp; Degrees</dt>
                  <dd className="text-slate-900">{teacher.qualification ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Date of Joining</dt>
                  <dd className="text-slate-900">{new Date(teacher.hiredAt).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Contract Type</dt>
                  <dd className="text-slate-900">
                    {teacher.contractType ? CONTRACT_TYPE_LABELS[teacher.contractType] : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Bank Account Details</dt>
                  <dd className="text-slate-900">
                    {teacher.bankName || teacher.bankAccountNumber
                      ? `${teacher.bankName ?? '—'} · ${teacher.bankAccountNumber ?? '—'}`
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">SSNIT Number</dt>
                  <dd className="text-slate-900">{teacher.ssnitNumber ?? '—'}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {editing && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveTeacher.mutate();
            }}
            className="rounded-lg bg-white p-6 shadow"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Department</label>
                <select
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as Department | '')}
                >
                  <option value="">—</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {DEPARTMENT_LABELS[d]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Employment Status</label>
                <select
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  value={employmentStatus}
                  onChange={(e) => setEmploymentStatus(e.target.value as EmploymentStatus | '')}
                >
                  <option value="">—</option>
                  {EMPLOYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {EMPLOYMENT_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Primary Phone Number</label>
                <input
                  type="tel"
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Contract Type</label>
                <select
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value as ContractType | '')}
                >
                  <option value="">—</option>
                  {CONTRACT_TYPES.map((c) => (
                    <option key={c} value={c}>
                      {CONTRACT_TYPE_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Qualifications &amp; Degrees</label>
                <input
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  placeholder="e.g. B.Ed Mathematics"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Bank Name</label>
                <input
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Bank Account Number</label>
                <input
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">SSNIT Number</label>
                <input
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  value={ssnitNumber}
                  onChange={(e) => setSsnitNumber(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saveTeacher.isPending}
              className="mt-4 rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-light disabled:opacity-50"
            >
              {saveTeacher.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
