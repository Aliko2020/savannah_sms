import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { addGuardianToStudent, isValidGuardianRelation, updateStudentGuardian } from '../services/guardianService';
import { resetUserPassword } from '../services/userService';
import { buildNameSearchWhere } from '../utils/nameSearch';
import { normalizeGhanaPhone } from '../utils/phone';

function shapeStudent(s: {
  id: string;
  admissionNumber: string;
  dateOfBirth: Date;
  gender: string | null;
  user: { firstName: string; otherName: string | null; lastName: string };
  enrollments: { class: { id: string; name: string; code: string; category: string } }[];
}) {
  const activeClass = s.enrollments[0]?.class ?? null;
  return {
    id: s.id,
    admissionNumber: s.admissionNumber,
    firstName: s.user.firstName,
    otherName: s.user.otherName,
    lastName: s.user.lastName,
    gender: s.gender,
    dateOfBirth: s.dateOfBirth,
    class: activeClass,
  };
}

export const listStudents = async (req: Request, res: Response): Promise<Response> => {
  const { classId, search } = req.query;

  const students = await prisma.studentProfile.findMany({
    where: {
      ...(classId ? { enrollments: { some: { classId: String(classId), isActive: true } } } : {}),
      user: buildNameSearchWhere(search),
    },
    include: {
      user: { select: { firstName: true, otherName: true, lastName: true } },
      enrollments: {
        where: { isActive: true },
        take: 1,
        select: { class: { select: { id: true, name: true, code: true, category: true } } },
      },
    },
    orderBy: { user: { firstName: 'asc' } },
  });

  return res.status(200).json(students.map(shapeStudent));
};

export const getStudent = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);

  const student = await prisma.studentProfile.findUnique({
    where: { id },
    include: {
      user: { select: { firstName: true, otherName: true, lastName: true, username: true } },
      enrollments: {
        where: { isActive: true },
        take: 1,
        select: { class: { select: { id: true, name: true, code: true, category: true } } },
      },
      guardians: {
        orderBy: { isPrimary: 'desc' },
        select: {
          relation: true,
          isPrimary: true,
          guardian: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              alternatePhone: true,
              email: true,
              address: true,
              occupation: true,
            },
          },
        },
      },
    },
  });

  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  return res.status(200).json({
    id: student.id,
    username: student.user.username,
    admissionNumber: student.admissionNumber,
    firstName: student.user.firstName,
    otherName: student.user.otherName,
    lastName: student.user.lastName,
    gender: student.gender,
    dateOfBirth: student.dateOfBirth,
    class: student.enrollments[0]?.class ?? null,
    previousSchool: student.previousSchool,
    reasonForLeaving: student.reasonForLeaving,
    medicalCondition: student.medicalCondition,
    guardians: student.guardians.map((g) => ({
      guardianId: g.guardian.id,
      fullName: g.guardian.fullName,
      phone: g.guardian.phone,
      alternatePhone: g.guardian.alternatePhone,
      email: g.guardian.email,
      address: g.guardian.address,
      occupation: g.guardian.occupation,
      relation: g.relation,
      isPrimary: g.isPrimary,
    })),
  });
};

// Admin override for pre-existing debt that predates this system — e.g. a
// balance carried over from a transferred student's previous school. This is
// the *only* sanctioned way to bill a student for something outside their
// prorated fee; it never changes enrolmentTermId/enrolmentDate, which stay
// truthful to when the student actually joined.
export const setOpeningBalance = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);
  const { openingBalance } = req.body;

  if (openingBalance === undefined || openingBalance === null) {
    return res.status(400).json({ error: 'openingBalance is required.' });
  }
  const amount = Number(openingBalance);
  if (!Number.isFinite(amount) || amount < 0) {
    return res.status(400).json({ error: 'openingBalance must be a non-negative number.' });
  }

  try {
    const updated = await prisma.studentProfile.update({
      where: { id },
      data: { openingBalance: amount },
      select: { id: true, openingBalance: true },
    });
    return res.status(200).json({ id: updated.id, openingBalance: Number(updated.openingBalance) });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Student not found.' });
    }
    console.error('Set Opening Balance Error:', error);
    return res.status(500).json({ error: 'Internal server error while updating opening balance.' });
  }
};

// Passwords are hashed one-way and never stored in a recoverable form, so
// there's no "view password" — this generates a fresh one and returns it
// once, exactly like the flow when the account was first created.
export const resetStudentPassword = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);

  const student = await prisma.studentProfile.findUnique({ where: { id }, select: { userId: true } });
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const generatedPassword = await resetUserPassword(student.userId);
  return res.status(200).json({ generatedPassword });
};

export const createGuardian = async (req: Request, res: Response): Promise<Response> => {
  const studentId = String(req.params.id);
  const { fullName, phone, alternatePhone, email, address, occupation, relation, isPrimary } = req.body;

  if (!fullName || !phone || !address) {
    return res.status(400).json({ error: 'fullName, phone, and address are required.' });
  }

  const normalizedPhone = normalizeGhanaPhone(phone);
  if (!normalizedPhone) {
    return res.status(400).json({ error: 'Invalid phone number. Use a 10-digit Ghanaian number, e.g. 0501234567.' });
  }

  const normalizedAltPhone = alternatePhone ? normalizeGhanaPhone(alternatePhone) : undefined;
  if (alternatePhone && !normalizedAltPhone) {
    return res
      .status(400)
      .json({ error: 'Invalid alternate phone number. Use a 10-digit Ghanaian number, e.g. 0501234567.' });
  }

  if (relation !== undefined && !isValidGuardianRelation(relation)) {
    return res.status(400).json({ error: 'Invalid relation.' });
  }

  const student = await prisma.studentProfile.findUnique({ where: { id: studentId }, select: { id: true } });
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  try {
    const guardian = await prisma.$transaction((tx) =>
      addGuardianToStudent(tx, studentId, {
        fullName,
        phone: normalizedPhone,
        alternatePhone: normalizedAltPhone,
        email,
        address,
        occupation,
        relation,
        isPrimary,
      }),
    );

    return res.status(201).json({ message: 'Guardian added.', guardianId: guardian.id });
  } catch (error: any) {
    console.error('Create Guardian Error:', error);
    return res.status(500).json({ error: 'Internal server error while adding guardian.' });
  }
};

export const updateGuardian = async (req: Request, res: Response): Promise<Response> => {
  const studentId = String(req.params.id);
  const guardianId = String(req.params.guardianId);
  const { fullName, phone, alternatePhone, email, address, occupation, relation, isPrimary } = req.body;

  if (relation !== undefined && !isValidGuardianRelation(relation)) {
    return res.status(400).json({ error: 'Invalid relation.' });
  }

  if (address !== undefined && !address) {
    return res.status(400).json({ error: 'Address is required.' });
  }

  const normalizedPhone = phone !== undefined ? normalizeGhanaPhone(phone) : undefined;
  if (phone !== undefined && !normalizedPhone) {
    return res.status(400).json({ error: 'Invalid phone number. Use a 10-digit Ghanaian number, e.g. 0501234567.' });
  }

  const normalizedAltPhone = alternatePhone ? normalizeGhanaPhone(alternatePhone) : undefined;
  if (alternatePhone && !normalizedAltPhone) {
    return res
      .status(400)
      .json({ error: 'Invalid alternate phone number. Use a 10-digit Ghanaian number, e.g. 0501234567.' });
  }

  const link = await prisma.studentGuardian.findUnique({
    where: { studentId_guardianId: { studentId, guardianId } },
  });
  if (!link) {
    return res.status(404).json({ error: 'This guardian is not linked to this student.' });
  }

  try {
    await prisma.$transaction((tx) =>
      updateStudentGuardian(tx, studentId, guardianId, {
        fullName,
        phone: normalizedPhone ?? undefined,
        alternatePhone: normalizedAltPhone !== undefined ? normalizedAltPhone : alternatePhone,
        email,
        address,
        occupation,
        relation,
        isPrimary,
      }),
    );

    return res.status(200).json({ message: 'Guardian updated.' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Guardian not found.' });
    }
    console.error('Update Guardian Error:', error);
    return res.status(500).json({ error: 'Internal server error while updating guardian.' });
  }
};
