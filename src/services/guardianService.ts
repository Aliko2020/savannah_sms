import { GuardianRelation, Prisma } from '../generated/prisma/client';
import { prisma } from '../config/db';

export interface GuardianInput {
  fullName: string;
  phone: string;
  alternatePhone?: string | null;
  email?: string | null;
  address?: string | null;
  occupation?: string | null;
  relation?: GuardianRelation;
  isPrimary?: boolean;
}

export function isValidGuardianRelation(value: unknown): value is GuardianRelation {
  return typeof value === 'string' && Object.values(GuardianRelation).includes(value as GuardianRelation);
}

// Prefers the guardian marked primary; falls back to any guardian on file so
// notifications still go out for students whose primary flag was never set.
export async function getPrimaryGuardianContact(
  studentId: string,
): Promise<{ fullName: string; phone: string } | null> {
  const link = await prisma.studentGuardian.findFirst({
    where: { studentId },
    orderBy: { isPrimary: 'desc' },
    include: { guardian: { select: { fullName: true, phone: true } } },
  });

  return link ? { fullName: link.guardian.fullName, phone: link.guardian.phone } : null;
}

// Creates a Guardian and links it to a student, unsetting any other primary
// guardian first so "at most one primary guardian" holds without a DB constraint.
export async function addGuardianToStudent(
  tx: Prisma.TransactionClient,
  studentId: string,
  input: GuardianInput,
) {
  if (input.isPrimary) {
    await tx.studentGuardian.updateMany({ where: { studentId }, data: { isPrimary: false } });
  }

  const guardian = await tx.guardian.create({
    data: {
      fullName: input.fullName,
      phone: input.phone,
      alternatePhone: input.alternatePhone || null,
      email: input.email || null,
      address: input.address || null,
      occupation: input.occupation || null,
    },
  });

  await tx.studentGuardian.create({
    data: {
      studentId,
      guardianId: guardian.id,
      relation: input.relation,
      isPrimary: !!input.isPrimary,
    },
  });

  return guardian;
}

export async function updateStudentGuardian(
  tx: Prisma.TransactionClient,
  studentId: string,
  guardianId: string,
  input: Partial<GuardianInput>,
) {
  if (input.isPrimary) {
    await tx.studentGuardian.updateMany({ where: { studentId }, data: { isPrimary: false } });
  }

  await tx.guardian.update({
    where: { id: guardianId },
    data: {
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.alternatePhone !== undefined ? { alternatePhone: input.alternatePhone || null } : {}),
      ...(input.email !== undefined ? { email: input.email || null } : {}),
      ...(input.address !== undefined ? { address: input.address || null } : {}),
      ...(input.occupation !== undefined ? { occupation: input.occupation || null } : {}),
    },
  });

  await tx.studentGuardian.update({
    where: { studentId_guardianId: { studentId, guardianId } },
    data: {
      ...(input.relation !== undefined ? { relation: input.relation } : {}),
      ...(input.isPrimary !== undefined ? { isPrimary: !!input.isPrimary } : {}),
    },
  });
}
