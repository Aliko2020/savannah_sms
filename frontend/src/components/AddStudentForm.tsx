import { useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { apiFetch, ApiError } from '../api/client';
import { CLASS_CATEGORY_LABELS } from '../constants';
import { titleCase } from '../utils/format';
import type { AcademicYear, ClassItem, Gender, GuardianRelation } from '../types';

interface CreateStudentResponse {
  message: string;
  userId: string;
  username: string;
  admissionNumber?: string;
  generatedPassword?: string;
}

function requiredLabel(text: string): ReactNode {
  return (
    <>
      {text}
      <span className="ml-0.5 text-danger-600">*</span>
    </>
  );
}

function isCompleteGuardian(fullName: string, phone: string, address: string) {
  return !!(fullName && phone && address);
}

function isPartialGuardian(fullName: string, phone: string, address: string) {
  return !!(fullName || phone || address) && !isCompleteGuardian(fullName, phone, address);
}

export function AddStudentForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState('');
  const [otherName, setOtherName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [classId, setClassId] = useState('');
  const [previousSchool, setPreviousSchool] = useState('');
  const [reasonForLeaving, setReasonForLeaving] = useState('');
  const [medicalCondition, setMedicalCondition] = useState('');

  const [motherName, setMotherName] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [motherAddress, setMotherAddress] = useState('');
  const [motherOccupation, setMotherOccupation] = useState('');

  const [fatherName, setFatherName] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [fatherAddress, setFatherAddress] = useState('');
  const [fatherOccupation, setFatherOccupation] = useState('');

  const [guardianError, setGuardianError] = useState<string | null>(null);

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
    mutationFn: () => {
      const guardians: {
        fullName: string;
        phone: string;
        address?: string;
        occupation?: string;
        relation: GuardianRelation;
      }[] = [];

      if (isCompleteGuardian(motherName, motherPhone, motherAddress)) {
        guardians.push({
          fullName: motherName,
          phone: motherPhone,
          address: motherAddress,
          occupation: motherOccupation || undefined,
          relation: 'MOTHER',
        });
      }
      if (isCompleteGuardian(fatherName, fatherPhone, fatherAddress)) {
        guardians.push({
          fullName: fatherName,
          phone: fatherPhone,
          address: fatherAddress,
          occupation: fatherOccupation || undefined,
          relation: 'FATHER',
        });
      }

      return apiFetch<CreateStudentResponse>('/users', {
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
            previousSchool: previousSchool || undefined,
            reasonForLeaving: reasonForLeaving || undefined,
            medicalCondition: medicalCondition || undefined,
            guardians,
          },
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const motherComplete = isCompleteGuardian(motherName, motherPhone, motherAddress);
    const fatherComplete = isCompleteGuardian(fatherName, fatherPhone, fatherAddress);

    if (isPartialGuardian(motherName, motherPhone, motherAddress)) {
      setGuardianError("Complete the Mother's full name, phone, and address, or leave all three blank.");
      return;
    }
    if (isPartialGuardian(fatherName, fatherPhone, fatherAddress)) {
      setGuardianError("Complete the Father's full name, phone, and address, or leave all three blank.");
      return;
    }
    if (!motherComplete && !fatherComplete) {
      setGuardianError('Add at least one parent (Mother or Father) with full name, phone, and address.');
      return;
    }

    setGuardianError(null);
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Input
            label="Previous school (if any)"
            value={previousSchool}
            onChange={(e) => setPreviousSchool(e.target.value)}
          />
          <Input
            label="Reason for leaving"
            value={reasonForLeaving}
            onChange={(e) => setReasonForLeaving(e.target.value)}
          />
          <Input
            label="Medical condition"
            placeholder="e.g. Asthma, none"
            value={medicalCondition}
            onChange={(e) => setMedicalCondition(e.target.value)}
          />
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="mb-1 text-sm font-medium text-zinc-700">Parent / Guardian</p>
        <p className="mb-3 text-xs text-zinc-500">
          Add at least one parent. Full name, phone, and address are required for whichever parent you add.
        </p>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Mother</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                label={requiredLabel('Full name')}
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
              />
              <Input
                type="tel"
                label={requiredLabel('Phone')}
                value={motherPhone}
                onChange={(e) => setMotherPhone(e.target.value)}
                pattern="0[2-5][0-9]{8}"
                title="Enter a valid 10-digit Ghanaian phone number, e.g. 0501234567"
                placeholder="0501234567"
              />
              <Input
                label={requiredLabel('Address')}
                value={motherAddress}
                onChange={(e) => setMotherAddress(e.target.value)}
              />
              <Input label="Occupation" value={motherOccupation} onChange={(e) => setMotherOccupation(e.target.value)} />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Father</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                label={requiredLabel('Full name')}
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
              />
              <Input
                type="tel"
                label={requiredLabel('Phone')}
                value={fatherPhone}
                onChange={(e) => setFatherPhone(e.target.value)}
                pattern="0[2-5][0-9]{8}"
                title="Enter a valid 10-digit Ghanaian phone number, e.g. 0501234567"
                placeholder="0501234567"
              />
              <Input
                label={requiredLabel('Address')}
                value={fatherAddress}
                onChange={(e) => setFatherAddress(e.target.value)}
              />
              <Input label="Occupation" value={fatherOccupation} onChange={(e) => setFatherOccupation(e.target.value)} />
            </div>
          </div>
        </div>

        {guardianError && <p className="mt-3 text-sm text-danger-600">{guardianError}</p>}
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
