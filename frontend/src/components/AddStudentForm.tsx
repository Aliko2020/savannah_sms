import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { apiFetch, ApiError } from '../api/client';
import { CLASS_CATEGORY_LABELS, GUARDIAN_RELATIONS, GUARDIAN_RELATION_LABELS } from '../constants';
import { titleCase } from '../utils/format';
import type { AcademicYear, ClassItem, Gender, GuardianRelation } from '../types';

interface CreateStudentResponse {
  message: string;
  userId: string;
  username: string;
  admissionNumber?: string;
  generatedPassword?: string;
}

export function AddStudentForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState('');
  const [otherName, setOtherName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [classId, setClassId] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianAlternatePhone, setGuardianAlternatePhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianAddress, setGuardianAddress] = useState('');
  const [guardianRelation, setGuardianRelation] = useState<GuardianRelation>('GUARDIAN');

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => apiFetch<AcademicYear[]>('/academic-years'),
  });
  const currentYear = academicYears?.find((y) => y.isCurrent) ?? academicYears?.[0];

  const { data: classes } = useQuery({
    queryKey: ['classes', currentYear?.id],
    queryFn: () => apiFetch<ClassItem[]>(`/classes?academicYearId=${currentYear!.id}`),
    enabled: !!currentYear,
  });

  const studentBlocked = (classes?.length ?? 0) === 0;

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<CreateStudentResponse>('/users', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          otherName: otherName || undefined,
          lastName,
          role: 'STUDENT',
          profileData: {
            dateOfBirth,
            gender,
            classId,
            guardianName,
            guardianPhone,
            guardianAlternatePhone: guardianAlternatePhone || undefined,
            guardianEmail: guardianEmail || undefined,
            guardianAddress: guardianAddress || undefined,
            guardianRelation,
          },
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  if (mutation.isSuccess && mutation.data) {
    return (
      <div className="mb-6 rounded-xl border border-success-500/20 bg-success-50 p-6 text-sm text-success-700">
        <p className="font-medium">Student enrolled successfully.</p>
        <p className="mt-1">
          Admission number: <span className="font-semibold">{mutation.data.admissionNumber}</span>
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

  const classOptions = (classes ?? []).flatMap((c) => ({
    value: c.id,
    label: titleCase(c.name),
    group: CLASS_CATEGORY_LABELS[c.category],
  }));

  return (
    <form onSubmit={handleSubmit} className="mb-6 space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">Add Student</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Input label="First name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <Input label="Other name" value={otherName} onChange={(e) => setOtherName(e.target.value)} />
        <Input label="Last name" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
        <Input
          type="date"
          label="Date of birth"
          required
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
        />
        <Select
          label="Gender"
          value={gender}
          onValueChange={(v) => setGender(v as Gender)}
          options={[
            { value: 'MALE', label: 'Male' },
            { value: 'FEMALE', label: 'Female' },
          ]}
        />
        <div>
          {classes && classes.length > 0 ? (
            <Select
              label="Grade / Class"
              required
              placeholder="Select a class"
              value={classId || undefined}
              onValueChange={setClassId}
              options={classOptions}
            />
          ) : (
            <>
              <label className="mb-1.5 block text-[13px] font-medium text-zinc-700">
                Grade / Class <span className="text-danger-600">*</span>
              </label>
              <p className="rounded-lg border border-dashed border-border-strong px-3 py-2 text-sm text-zinc-500">
                No classes set up yet.{' '}
                <Link to="/classes" className="font-medium text-primary-700 hover:underline">
                  Create one first
                </Link>
                .
              </p>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="mb-3 text-sm font-medium text-zinc-700">Parent / Guardian</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select
            label="Relationship"
            value={guardianRelation}
            onValueChange={(v) => setGuardianRelation(v as GuardianRelation)}
            options={GUARDIAN_RELATIONS.map((r) => ({ value: r, label: GUARDIAN_RELATION_LABELS[r] }))}
          />
          <Input label="Full name" required value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
          <Input
            type="tel"
            label="Phone"
            required
            value={guardianPhone}
            onChange={(e) => setGuardianPhone(e.target.value)}
            pattern="0[2-5][0-9]{8}"
            title="Enter a valid 10-digit Ghanaian phone number, e.g. 0501234567"
            placeholder="0501234567"
          />
          <Input
            type="tel"
            label="Alternate phone"
            value={guardianAlternatePhone}
            onChange={(e) => setGuardianAlternatePhone(e.target.value)}
            pattern="0[2-5][0-9]{8}"
            title="Enter a valid 10-digit Ghanaian phone number, e.g. 0501234567"
            placeholder="0501234567"
          />
          <Input type="email" label="Email" value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} />
          <Input label="Address" required value={guardianAddress} onChange={(e) => setGuardianAddress(e.target.value)} />
        </div>
      </div>

      {mutation.isError && (
        <p className="text-sm text-danger-600">
          {mutation.error instanceof ApiError ? mutation.error.message : 'Something went wrong.'}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" loading={mutation.isPending} disabled={studentBlocked}>
          {studentBlocked ? 'Create a class first' : 'Enroll Student'}
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
