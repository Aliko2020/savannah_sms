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

interface ProfileData {
  department?: Department;
  phone?: string;
  qualification?: string;
  employmentStatus?: EmploymentStatus;
  contractType?: ContractType;
  ssnitNumber?: string;
  dateOfBirth?: string;
  gender?: Gender;
  classId?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianAlternatePhone?: string;
  guardianEmail?: string;
  guardianAddress?: string;
  guardianRelation?: GuardianRelation;
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
        },
      });
    } else if (input.role === 'STUDENT' && input.profileData) {
      admissionNumber = await generateAdmissionNumber(tx);

      const studentProfile = await tx.studentProfile.create({
        data: {
          userId: newUser.id,
          admissionNumber,
          dateOfBirth: new Date(input.profileData.dateOfBirth!),
          gender: input.profileData.gender,
        },
      });

      if (input.profileData.guardianName && input.profileData.guardianPhone) {
        const guardian = await tx.guardian.create({
          data: {
            fullName: input.profileData.guardianName,
            phone: input.profileData.guardianPhone,
            alternatePhone: input.profileData.guardianAlternatePhone || null,
            email: input.profileData.guardianEmail || null,
            address: input.profileData.guardianAddress || null,
          },
        });

        await tx.studentGuardian.create({
          data: {
            studentId: studentProfile.id,
            guardianId: guardian.id,
            relation: input.profileData.guardianRelation,
            isPrimary: true,
          },
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
