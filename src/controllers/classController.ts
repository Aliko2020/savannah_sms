import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { ClassCategory } from '../generated/prisma/client';

function shapeClass(c: {
  id: string;
  name: string;
  code: string;
  category: ClassCategory;
  academicYearId: string;
  gradeLevelId: string;
  gradeLevel?: { id: string; name: string; order: number } | null;
  formTeacher: { id: string; user: { firstName: string; lastName: string } } | null;
  _count: { enrollments: number };
}) {
  return {
    id: c.id,
    name: c.name,
    code: c.code,
    category: c.category,
    academicYearId: c.academicYearId,
    gradeLevelId: c.gradeLevelId,
    gradeLevel: c.gradeLevel ?? null,
    formTeacher: c.formTeacher
      ? { id: c.formTeacher.id, firstName: c.formTeacher.user.firstName, lastName: c.formTeacher.user.lastName }
      : null,
    studentCount: c._count.enrollments,
  };
}

export const listClasses = async (req: Request, res: Response): Promise<Response> => {
  const { academicYearId, category } = req.query;

  const classes = await prisma.class.findMany({
    where: {
      ...(academicYearId ? { academicYearId: String(academicYearId) } : {}),
      ...(category ? { category: String(category) as ClassCategory } : {}),
    },
    include: {
      formTeacher: { include: { user: { select: { firstName: true, lastName: true } } } },
      gradeLevel: { select: { id: true, name: true, order: true } },
      _count: { select: { enrollments: true } },
    },
    // Category enum is declared PRE_SCHOOL, PRIMARY, JHS — ascending order matches that.
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

  return res.status(200).json(classes.map(shapeClass));
};

// Scoped to the academic year — a teacher can be the form teacher of at
// most one class per year, not one class ever, so they're free to be
// assigned again once a new academic year's classes exist even if they're
// still listed against last year's (now-historical) class.
async function assertTeacherUnassigned(formTeacherId: string, academicYearId: string, excludeClassId?: string): Promise<string | null> {
  const conflict = await prisma.class.findFirst({
    where: { formTeacherId, academicYearId, ...(excludeClassId ? { id: { not: excludeClassId } } : {}) },
    select: { name: true },
  });
  return conflict ? `This teacher is already the class teacher of "${conflict.name}" this academic year. Unassign them there first.` : null;
}

export const createClass = async (req: Request, res: Response): Promise<Response> => {
  const { name, code, category, academicYearId, formTeacherId, gradeLevelId } = req.body;

  if (!name || !code || !category || !academicYearId || !gradeLevelId) {
    return res.status(400).json({ error: 'name, code, category, academicYearId, and gradeLevelId are required.' });
  }

  if (!Object.values(ClassCategory).includes(category)) {
    return res.status(400).json({ error: 'Invalid category.' });
  }

  if (formTeacherId) {
    const conflictMessage = await assertTeacherUnassigned(formTeacherId, academicYearId);
    if (conflictMessage) {
      return res.status(400).json({ error: conflictMessage });
    }
  }

  try {
    const newClass = await prisma.class.create({
      data: {
        name,
        code,
        category,
        academicYearId,
        gradeLevelId,
        formTeacherId: formTeacherId || null,
      },
      include: {
        formTeacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        gradeLevel: { select: { id: true, name: true, order: true } },
        _count: { select: { enrollments: true } },
      },
    });

    return res.status(201).json(shapeClass(newClass));
  } catch (error: any) {
    if (error.code === 'P2002') {
      if (String(error.meta?.target).includes('formTeacherId')) {
        return res.status(400).json({ error: 'This teacher is already assigned to another class.' });
      }
      return res.status(400).json({ error: 'A class with this code already exists.' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'That academic year, grade level, or teacher does not exist.' });
    }
    console.error('Create Class Error:', error);
    return res.status(500).json({ error: 'Internal server error while creating class.' });
  }
};

export const updateClass = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);
  const { name, code, category, formTeacherId, gradeLevelId } = req.body;

  if (category && !Object.values(ClassCategory).includes(category)) {
    return res.status(400).json({ error: 'Invalid category.' });
  }

  if (formTeacherId) {
    const existing = await prisma.class.findUnique({ where: { id }, select: { academicYearId: true } });
    if (!existing) {
      return res.status(404).json({ error: 'Class not found.' });
    }
    const conflictMessage = await assertTeacherUnassigned(formTeacherId, existing.academicYearId, id);
    if (conflictMessage) {
      return res.status(400).json({ error: conflictMessage });
    }
  }

  try {
    const updated = await prisma.class.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(code !== undefined ? { code } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(formTeacherId !== undefined ? { formTeacherId: formTeacherId || null } : {}),
        ...(gradeLevelId !== undefined ? { gradeLevelId } : {}),
      },
      include: {
        formTeacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        gradeLevel: { select: { id: true, name: true, order: true } },
        _count: { select: { enrollments: true } },
      },
    });

    return res.status(200).json(shapeClass(updated));
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Class not found.' });
    }
    if (error.code === 'P2002') {
      if (String(error.meta?.target).includes('formTeacherId')) {
        return res.status(400).json({ error: 'This teacher is already assigned to another class.' });
      }
      return res.status(400).json({ error: 'A class with this code already exists.' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'That grade level does not exist.' });
    }
    console.error('Update Class Error:', error);
    return res.status(500).json({ error: 'Internal server error while updating class.' });
  }
};

export const getClassStudents = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);

  const cls = await prisma.class.findUnique({
    where: { id },
    select: { id: true, name: true, formTeacher: { select: { userId: true } } },
  });

  if (!cls) {
    return res.status(404).json({ error: 'Class not found.' });
  }

  const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
  const isFormTeacher = req.user?.role === 'TEACHER' && cls.formTeacher?.userId === req.user.id;

  if (!isStaff && !isFormTeacher) {
    return res.status(403).json({ error: 'You do not have permission to view this class list.' });
  }

  // Not filtered to isActive: true — a Class is a homeroom for ONE academic
  // year (never reused across years), so every Enrollment row against this
  // classId belongs to it regardless of whether that student has since been
  // promoted into a different class. Filtering on it here broke historical
  // views (roster, class assessment, score sheets) once every student in an
  // old class had been promoted out of it.
  const enrollments = await prisma.enrollment.findMany({
    where: { classId: id },
    include: {
      student: {
        select: {
          id: true,
          admissionNumber: true,
          gender: true,
          user: { select: { firstName: true, otherName: true, lastName: true } },
          guardians: {
            orderBy: { isPrimary: 'desc' },
            take: 1,
            select: {
              relation: true,
              guardian: { select: { fullName: true, phone: true, address: true } },
            },
          },
        },
      },
    },
    orderBy: { student: { user: { firstName: 'asc' } } },
  });

  return res.status(200).json(
    enrollments.map((e) => {
      const guardian = e.student.guardians[0];
      return {
        id: e.student.id,
        admissionNumber: e.student.admissionNumber,
        firstName: e.student.user.firstName,
        otherName: e.student.user.otherName,
        lastName: e.student.user.lastName,
        gender: e.student.gender,
        guardianName: guardian?.guardian.fullName ?? null,
        guardianPhone: guardian?.guardian.phone ?? null,
        guardianAddress: guardian?.guardian.address ?? null,
        guardianRelation: guardian?.relation ?? null,
      };
    }),
  );
};

// A report-card style view: every student in the class as a row, every
// subject taught in the class as a column, with each cell showing that
// student's total score (out of 100) for that subject in the given term.
export const getClassAssessmentReport = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);
  const { termId } = req.query;

  if (!termId) {
    return res.status(400).json({ error: 'termId is required.' });
  }

  const cls = await prisma.class.findUnique({
    where: { id },
    select: { name: true, formTeacher: { select: { userId: true } } },
  });

  if (!cls) {
    return res.status(404).json({ error: 'Class not found.' });
  }

  const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
  const isFormTeacher = req.user?.role === 'TEACHER' && cls.formTeacher?.userId === req.user.id;

  if (!isStaff && !isFormTeacher) {
    return res.status(403).json({ error: 'You do not have permission to view this class report.' });
  }

  const classSubjects = await prisma.classSubject.findMany({
    where: { classId: id },
    include: { subject: { select: { name: true, code: true } } },
    orderBy: { subject: { name: 'asc' } },
  });
  const classSubjectIds = classSubjects.map((cs) => cs.id);

  // Not filtered to isActive: true — a Class is a homeroom for ONE academic
  // year (never reused across years), so every Enrollment row against this
  // classId belongs to it regardless of whether that student has since been
  // promoted into a different class. Filtering on it here broke historical
  // views (roster, class assessment, score sheets) once every student in an
  // old class had been promoted out of it.
  const enrollments = await prisma.enrollment.findMany({
    where: { classId: id },
    include: {
      student: {
        select: {
          id: true,
          admissionNumber: true,
          user: { select: { firstName: true, otherName: true, lastName: true } },
          scores: {
            where: { termId: String(termId), classSubjectId: { in: classSubjectIds } },
            select: { classSubjectId: true, total: true },
          },
        },
      },
    },
    orderBy: { student: { user: { firstName: 'asc' } } },
  });

  return res.status(200).json({
    subjects: classSubjects.map((cs) => ({
      classSubjectId: cs.id,
      subjectName: cs.subject.name,
      subjectCode: cs.subject.code,
    })),
    students: enrollments.map((e) => {
      const scores: Record<string, number | null> = {};
      for (const cs of classSubjects) {
        const score = e.student.scores.find((s) => s.classSubjectId === cs.id);
        scores[cs.id] = score?.total !== null && score?.total !== undefined ? Number(score.total) : null;
      }
      return {
        studentId: e.student.id,
        admissionNumber: e.student.admissionNumber,
        firstName: e.student.user.firstName,
        otherName: e.student.user.otherName,
        lastName: e.student.user.lastName,
        scores,
      };
    }),
  });
};

export const deleteClass = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);

  try {
    await prisma.class.delete({ where: { id } });
    return res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Class not found.' });
    }
    if (error.code === 'P2003' || error.code === 'P2014') {
      return res.status(400).json({ error: 'Cannot delete a class that has enrolled students or attendance records.' });
    }
    console.error('Delete Class Error:', error);
    return res.status(500).json({ error: 'Internal server error while deleting class.' });
  }
};
