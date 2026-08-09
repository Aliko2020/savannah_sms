import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { ContractType, Department, EmploymentStatus, Gender } from '../generated/prisma/client';
import { normalizeGhanaPhone } from '../utils/phone';
import { resetUserPassword } from '../services/userService';

export const listTeachers = async (_req: Request, res: Response): Promise<Response> => {
  const teachers = await prisma.teacherProfile.findMany({
    include: {
      user: { select: { firstName: true, otherName: true, lastName: true } },
      formClasses: { select: { id: true, name: true } },
    },
    orderBy: { user: { firstName: 'asc' } },
  });

  return res.status(200).json(
    teachers.map((t) => ({
      id: t.id,
      firstName: t.user.firstName,
      otherName: t.user.otherName,
      lastName: t.user.lastName,
      employeeId: t.employeeId,
      department: t.department,
      phone: t.phone,
      gender: t.gender,
      qualification: t.qualification,
      employmentStatus: t.employmentStatus,
      assignedClass: t.formClasses[0] ? { id: t.formClasses[0].id, name: t.formClasses[0].name } : null,
    })),
  );
};

const teacherDetailInclude = {
  user: { select: { firstName: true, otherName: true, lastName: true, username: true, email: true } },
  formClasses: {
    select: { id: true, name: true, code: true, category: true, _count: { select: { enrollments: true } } },
  },
} as const;

function serializeTeacherDetail(teacher: {
  id: string;
  user: { firstName: string; otherName: string | null; lastName: string; username: string; email: string | null };
  employeeId: string;
  department: Department | null;
  phone: string | null;
  gender: Gender | null;
  qualification: string | null;
  employmentStatus: EmploymentStatus | null;
  contractType: ContractType | null;
  hiredAt: Date;
  bankName: string | null;
  bankAccountNumber: string | null;
  ssnitNumber: string | null;
  formClasses: { id: string; name: string; code: string; category: string; _count: { enrollments: number } }[];
}) {
  return {
    id: teacher.id,
    firstName: teacher.user.firstName,
    otherName: teacher.user.otherName,
    lastName: teacher.user.lastName,
    username: teacher.user.username,
    email: teacher.user.email,
    employeeId: teacher.employeeId,
    department: teacher.department,
    phone: teacher.phone,
    gender: teacher.gender,
    qualification: teacher.qualification,
    employmentStatus: teacher.employmentStatus,
    contractType: teacher.contractType,
    hiredAt: teacher.hiredAt,
    bankName: teacher.bankName,
    bankAccountNumber: teacher.bankAccountNumber,
    ssnitNumber: teacher.ssnitNumber,
    assignedClasses: teacher.formClasses.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      category: c.category,
      studentCount: c._count.enrollments,
    })),
    totalStudents: teacher.formClasses.reduce((sum, c) => sum + c._count.enrollments, 0),
  };
}

export const getTeacher = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);

  const teacher = await prisma.teacherProfile.findUnique({
    where: { id },
    include: teacherDetailInclude,
  });

  if (!teacher) {
    return res.status(404).json({ error: 'Teacher not found.' });
  }

  const isOwner = req.user?.role === 'TEACHER' && teacher.userId === req.user.id;
  const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

  if (!isStaff && !isOwner) {
    return res.status(403).json({ error: 'You do not have permission to view this profile.' });
  }

  return res.status(200).json(serializeTeacherDetail(teacher));
};

export const getMyTeacherProfile = async (req: Request, res: Response): Promise<Response> => {
  const teacher = await prisma.teacherProfile.findUnique({
    where: { userId: req.user!.id },
    include: teacherDetailInclude,
  });

  if (!teacher) {
    return res.status(404).json({ error: 'No teacher profile found for this account.' });
  }

  return res.status(200).json(serializeTeacherDetail(teacher));
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const updateTeacher = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);
  const {
    department,
    phone,
    email,
    gender,
    qualification,
    employmentStatus,
    contractType,
    bankName,
    bankAccountNumber,
    ssnitNumber,
  } = req.body;

  if (department !== undefined && department !== null && !Object.values(Department).includes(department)) {
    return res.status(400).json({ error: 'Invalid department.' });
  }
  if (gender !== undefined && gender !== null && !Object.values(Gender).includes(gender)) {
    return res.status(400).json({ error: 'Invalid gender.' });
  }
  if (
    employmentStatus !== undefined &&
    employmentStatus !== null &&
    !Object.values(EmploymentStatus).includes(employmentStatus)
  ) {
    return res.status(400).json({ error: 'Invalid employment status.' });
  }
  if (contractType !== undefined && contractType !== null && !Object.values(ContractType).includes(contractType)) {
    return res.status(400).json({ error: 'Invalid contract type.' });
  }

  const normalizedPhone = phone ? normalizeGhanaPhone(phone) : undefined;
  if (phone && !normalizedPhone) {
    return res.status(400).json({ error: 'Invalid phone number. Use a 10-digit Ghanaian number, e.g. 0501234567.' });
  }

  if (email && !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  try {
    const updated = await prisma.teacherProfile.update({
      where: { id },
      data: {
        ...(department !== undefined ? { department } : {}),
        ...(phone !== undefined ? { phone: phone ? normalizedPhone : phone } : {}),
        ...(gender !== undefined ? { gender } : {}),
        ...(qualification !== undefined ? { qualification } : {}),
        ...(employmentStatus !== undefined ? { employmentStatus } : {}),
        ...(contractType !== undefined ? { contractType } : {}),
        ...(bankName !== undefined ? { bankName } : {}),
        ...(bankAccountNumber !== undefined ? { bankAccountNumber } : {}),
        ...(ssnitNumber !== undefined ? { ssnitNumber } : {}),
        ...(email !== undefined ? { user: { update: { email: email || null } } } : {}),
      },
      include: teacherDetailInclude,
    });

    return res.status(200).json(serializeTeacherDetail(updated));
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Teacher not found.' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'That email address is already in use by another account.' });
    }
    console.error('Update Teacher Error:', error);
    return res.status(500).json({ error: 'Internal server error while updating teacher.' });
  }
};

// Passwords are hashed one-way and never stored in a recoverable form, so
// there's no "view password" — this generates a fresh one and returns it
// once, exactly like the flow when the account was first created.
export const resetTeacherPassword = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);

  const teacher = await prisma.teacherProfile.findUnique({ where: { id }, select: { userId: true } });
  if (!teacher) {
    return res.status(404).json({ error: 'Teacher not found.' });
  }

  const generatedPassword = await resetUserPassword(teacher.userId);
  return res.status(200).json({ generatedPassword });
};

export const deleteTeacher = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);

  const teacher = await prisma.teacherProfile.findUnique({ where: { id }, select: { userId: true } });

  if (!teacher) {
    return res.status(404).json({ error: 'Teacher not found.' });
  }

  // Deleting the User cascades to TeacherProfile; Class.formTeacher and
  // ClassSubject.teacher references are set to null automatically.
  await prisma.user.delete({ where: { id: teacher.userId } });

  return res.status(204).send();
};
