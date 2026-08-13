import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../config/db';
import {
  ContractType,
  Department,
  EmploymentStatus,
  Gender,
  GuardianRelation,
  Prisma,
  Role,
} from '../generated/prisma/client';
import { addGuardianToStudent } from './guardianService';

interface GuardianEntry {
  fullName: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  occupation?: string;
  relation: GuardianRelation;
}

interface ProfileData {
  department?: Department;
  phone?: string;
  qualification?: string;
  employmentStatus?: EmploymentStatus;
  contractType?: ContractType;
  ssnitNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  religion?: string;
  isLicensed?: boolean;
  licenseNumber?: string;
  dateOfBirth?: string;
  gender?: Gender;
  classId?: string;
  // Prior schooling — free text, all optional.
  previousSchool?: string;
  reasonForLeaving?: string;
  medicalCondition?: string;
  // Zero or more guardians (e.g. mother + father) recorded at enrollment
  // time. The first entry is treated as primary.
  guardians?: GuardianEntry[];
  // Admin-recorded debt for a transferred student (e.g. an unpaid balance
  // from their previous school). Added on top of their prorated fee, never
  // in place of it.
  openingBalance?: number;
}

interface CreateUserInput {
  username?: string;
  email?: string | null;
  password?: string;
  firstName: string;
  otherName?: string;
  lastName: string;
  role: Role;
  profileData?: ProfileData;
}

// ADM-<year>-<sequence within that year>, e.g. ADM-2026-0001.
async function generateAdmissionNumber(tx: Prisma.TransactionClient) {
  const year = new Date().getFullYear();
  const prefix = `ADM-${year}-`;
  const count = await tx.studentProfile.count({ where: { admissionNumber: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
}

// EMP-<year>-<sequence within that year>, e.g. EMP-2026-0001.
async function generateEmployeeId(tx: Prisma.TransactionClient) {
  const year = new Date().getFullYear();
  const prefix = `EMP-${year}-`;
  const count = await tx.teacherProfile.count({ where: { employeeId: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
}

// firstname.lastname, deduped with a numeric suffix on collision.
async function generateUsername(tx: Prisma.TransactionClient, firstName: string, lastName: string) {
  const base =
    `${firstName}.${lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '')
      .replace(/\.+/g, '.')
      .replace(/^\.|\.$/g, '') || 'user';

  let candidate = base;
  let suffix = 1;
  while (await tx.user.findUnique({ where: { username: candidate } })) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
  return candidate;
}

// Excludes visually ambiguous characters (I, O, l, 0, 1) since it gets read aloud/copied by hand.
function generatePassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from(crypto.randomBytes(length), (b) => chars[b % chars.length]).join('');
}

// Passwords are hashed one-way (bcrypt) and never stored in a recoverable
// form, so there is no way to "view" an existing password — this generates
// and stores a brand-new one instead, returned once for the admin to share.
export async function resetUserPassword(userId: string): Promise<string> {
  const generatedPassword = generatePassword();
  const hashedPassword = await bcrypt.hash(generatedPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
  return generatedPassword;
}

export const createUserAccount = async (input: CreateUserInput) => {
  const autoGenerateCredentials = input.role === 'STUDENT' || input.role === 'TEACHER';

  return prisma.$transaction(async (tx) => {
    const username = autoGenerateCredentials
      ? await generateUsername(tx, input.firstName, input.lastName)
      : input.username!;
    const generatedPassword = autoGenerateCredentials ? generatePassword() : undefined;
    const hashedPassword = await bcrypt.hash(generatedPassword ?? input.password!, 10);

    const newUser = await tx.user.create({
      data: {
        username,
        email: input.email || null,
        password: hashedPassword,
        role: input.role,
        firstName: input.firstName,
        otherName: input.otherName || null,
        lastName: input.lastName,
      },
    });

    let admissionNumber: string | undefined;
    let employeeId: string | undefined;

    if (input.role === 'TEACHER' && input.profileData) {
      employeeId = await generateEmployeeId(tx);

      await tx.teacherProfile.create({
        data: {
          userId: newUser.id,
          employeeId,
          department: input.profileData.department,
          phone: input.profileData.phone,
          gender: input.profileData.gender,
          qualification: input.profileData.qualification,
          employmentStatus: input.profileData.employmentStatus,
          contractType: input.profileData.contractType,
          ssnitNumber: input.profileData.ssnitNumber,
          bankName: input.profileData.bankName,
          bankAccountNumber: input.profileData.bankAccountNumber,
          religion: input.profileData.religion,
          isLicensed: input.profileData.isLicensed ?? false,
          licenseNumber: input.profileData.isLicensed ? input.profileData.licenseNumber : undefined,
        },
      });
    } else if (input.role === 'STUDENT' && input.profileData) {
      admissionNumber = await generateAdmissionNumber(tx);

      // Enrolment term/date are never client-supplied — they always reflect
      // whichever term is active right now, the same way the whole fee
      // calculation trusts server state over anything a request claims. This
      // is what actually fixes the bug: a student registered mid-year is
      // billed from the current term forward, never from the start of the
      // year. (Pre-existing debt for a transferred student is handled
      // separately via openingBalance, not by backdating enrolmentTermId.)
      const currentTerm = await tx.term.findFirst({ where: { isCurrent: true }, select: { id: true } });

      const studentProfile = await tx.studentProfile.create({
        data: {
          userId: newUser.id,
          admissionNumber,
          dateOfBirth: new Date(input.profileData.dateOfBirth!),
          gender: input.profileData.gender,
          previousSchool: input.profileData.previousSchool,
          reasonForLeaving: input.profileData.reasonForLeaving,
          medicalCondition: input.profileData.medicalCondition,
          enrolmentTermId: currentTerm?.id ?? null,
          enrolmentDate: new Date(),
          openingBalance: input.profileData.openingBalance ?? 0,
        },
      });

      // First guardian in the list (e.g. Mother, if provided) is treated as
      // primary — the one used for SMS reminders and default contact.
      for (const [index, guardian] of (input.profileData.guardians ?? []).entries()) {
        await addGuardianToStudent(tx, studentProfile.id, {
          fullName: guardian.fullName,
          phone: guardian.phone,
          alternatePhone: guardian.alternatePhone,
          email: guardian.email,
          address: guardian.address,
          occupation: guardian.occupation,
          relation: guardian.relation,
          isPrimary: index === 0,
        });
      }

      // classId is required at the controller level for STUDENT enrollment.
      await tx.enrollment.create({
        data: {
          studentId: studentProfile.id,
          classId: input.profileData.classId!,
        },
      });
    }

    return { user: newUser, admissionNumber, employeeId, generatedPassword };
  });
};
