import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { ContractType, Department, EmploymentStatus, Gender } from '../generated/prisma/client';

export const listTeachers = async (_req: Request, res: Response): Promise<Response> => {
  const teachers = await prisma.teacherProfile.findMany({
    include: { user: { select: { firstName: true, otherName: true, lastName: true } } },
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
    })),
  );
};

const teacherDetailInclude = {
  user: { select: { firstName: true, otherName: true, lastName: true, username: true } },
  formClasses: { select: { id: true, name: true, code: true, category: true } },
} as const;

function serializeTeacherDetail(teacher: {
  id: string;
  user: { firstName: string; otherName: string | null; lastName: string; username: string };
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
  formClasses: { id: string; name: string; code: string; category: string }[];
}) {
  return {
    id: teacher.id,
    firstName: teacher.user.firstName,
    otherName: teacher.user.otherName,
    lastName: teacher.user.lastName,
    username: teacher.user.username,
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
    assignedClasses: teacher.formClasses,
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

export const updateTeacher = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);
  const {
    department,
    phone,
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

  try {
    const updated = await prisma.teacherProfile.update({
      where: { id },
      data: {
        ...(department !== undefined ? { department } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(gender !== undefined ? { gender } : {}),
        ...(qualification !== undefined ? { qualification } : {}),
        ...(employmentStatus !== undefined ? { employmentStatus } : {}),
        ...(contractType !== undefined ? { contractType } : {}),
        ...(bankName !== undefined ? { bankName } : {}),
        ...(bankAccountNumber !== undefined ? { bankAccountNumber } : {}),
        ...(ssnitNumber !== undefined ? { ssnitNumber } : {}),
      },
    });

    return res.status(200).json(updated);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Teacher not found.' });
    }
    console.error('Update Teacher Error:', error);
    return res.status(500).json({ error: 'Internal server error while updating teacher.' });
  }
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
