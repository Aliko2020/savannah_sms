import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { apiFetch, ApiError } from '../api/client';
import { CONTRACT_TYPES, CONTRACT_TYPE_LABELS, DEPARTMENTS, DEPARTMENT_LABELS } from '../constants';
import type { ContractType, Department, Gender } from '../types';

interface CreateTeacherResponse {
  message: string;
  userId: string;
  username: string;
  employeeId?: string;
  generatedPassword?: string;
}

export function AddTeacherForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState('');
  const [otherName, setOtherName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState<Department | ''>('');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherGender, setTeacherGender] = useState<Gender>('MALE');
  const [qualification, setQualification] = useState('');
  const [isLicensed, setIsLicensed] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [contractType, setContractType] = useState<ContractType | ''>('');
  const [ssnitNumber, setSsnitNumber] = useState('');
  const [religion, setReligion] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<CreateTeacherResponse>('/users', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          otherName: otherName || undefined,
          lastName,
          email: teacherEmail || undefined,
          role: 'TEACHER',
          profileData: {
            department: department || undefined,
            phone: teacherPhone,
            gender: teacherGender,
            qualification: qualification || undefined,
            isLicensed,
            licenseNumber: isLicensed ? licenseNumber || undefined : undefined,
            contractType: contractType || undefined,
            ssnitNumber: ssnitNumber || undefined,
            religion: religion || undefined,
            bankName: bankName || undefined,
            bankAccountNumber: bankAccountNumber || undefined,
          },
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  if (mutation.isSuccess && mutation.data) {
    return (
      <div className="mb-6 rounded-xl border border-success-500/20 bg-success-50 p-6 text-sm text-success-700">
        <p className="font-medium">Teacher added successfully.</p>
        <p className="mt-1">
          Employee ID: <span className="font-semibold">{mutation.data.employeeId}</span>
        </p>
        <p>
          Login: <span className="font-semibold">{mutation.data.username}</span> / password:{' '}
          <span className="font-semibold">{mutation.data.generatedPassword}</span> — share this once and have them
          change it after logging in.
        </p>
        <Button size="sm" className="mt-3" onClick={onDone}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">Add Teacher</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Input label="First name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <Input label="Other name" value={otherName} onChange={(e) => setOtherName(e.target.value)} />
        <Input label="Last name" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-border pt-4 md:grid-cols-3">
        <Select
          label="Department"
          required
          placeholder="Select a department"
          value={department || undefined}
          onValueChange={(v) => setDepartment(v as Department)}
          options={DEPARTMENTS.map((d) => ({ value: d, label: DEPARTMENT_LABELS[d] }))}
        />
        <Input
          type="tel"
          label="Phone number"
          required
          value={teacherPhone}
          onChange={(e) => setTeacherPhone(e.target.value)}
          pattern="0[2-5][0-9]{8}"
          title="Enter a valid 10-digit Ghanaian phone number, e.g. 0501234567"
          placeholder="0501234567"
        />
        <Input
          type="email"
          label="Email (optional)"
          value={teacherEmail}
          onChange={(e) => setTeacherEmail(e.target.value)}
          placeholder="teacher@example.com"
        />
        <Select
          label="Gender"
          value={teacherGender}
          onValueChange={(v) => setTeacherGender(v as Gender)}
          options={[
            { value: 'MALE', label: 'Male' },
            { value: 'FEMALE', label: 'Female' },
          ]}
        />
        <Select
          label="Contract Type"
          placeholder="—"
          value={contractType || undefined}
          onValueChange={(v) => setContractType(v as ContractType)}
          options={CONTRACT_TYPES.map((c) => ({ value: c, label: CONTRACT_TYPE_LABELS[c] }))}
        />
        <Input label="SSNIT Number" value={ssnitNumber} onChange={(e) => setSsnitNumber(e.target.value)} />
        <Input label="Religion" value={religion} onChange={(e) => setReligion(e.target.value)} />
        <Input label="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
        <Input
          label="Account number"
          value={bankAccountNumber}
          onChange={(e) => setBankAccountNumber(e.target.value)}
        />
        <div className="md:col-span-3">
          <Input
            label="Qualification"
            placeholder="e.g. B.Ed Mathematics"
            value={qualification}
            onChange={(e) => setQualification(e.target.value)}
          />
        </div>
        <div className="md:col-span-3 flex flex-col gap-2">
          <Checkbox
            label="Is Licensed?"
            checked={isLicensed}
            onCheckedChange={(checked) => setIsLicensed(checked === true)}
          />
          {isLicensed && (
            <Input
              label="License number"
              required
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
            />
          )}
        </div>
      </div>

      {mutation.isError && (
        <p className="text-sm text-danger-600">
          {mutation.error instanceof ApiError ? mutation.error.message : 'Something went wrong.'}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" loading={mutation.isPending}>
          Add Teacher
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
