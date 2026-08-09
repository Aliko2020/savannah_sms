import { Request, Response } from 'express';
import { prisma } from '../config/db';

function shapeClassSubject(cs: {
  id: string;
  classId: string;
  class: { name: string; code: string };
  subjectId: string;
  subject: { name: string; code: string };
  teacherId: string | null;
  teacher: { id: string; user: { firstName: string; lastName: string } } | null;
}) {
  return {
    id: cs.id,
    classId: cs.classId,
    className: cs.class.name,
    classCode: cs.class.code,
    subjectId: cs.subjectId,
    subjectName: cs.subject.name,
    subjectCode: cs.subject.code,
    teacher: cs.teacher
      ? { id: cs.teacher.id, firstName: cs.teacher.user.firstName, lastName: cs.teacher.user.lastName }
      : null,
  };
}

const classSubjectInclude = {
  class: { select: { name: true, code: true } },
  subject: { select: { name: true, code: true } },
  teacher: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
} as const;

export const listClassSubjects = async (req: Request, res: Response): Promise<Response> => {
  const { classId } = req.query;

  const classSubjects = await prisma.classSubject.findMany({
    where: classId ? { classId: String(classId) } : undefined,
    include: classSubjectInclude,
    orderBy: { subject: { name: 'asc' } },
  });

  return res.status(200).json(classSubjects.map(shapeClassSubject));
};

// Subjects aren't manually assigned to classes by an admin — a teacher just
// picks a subject to enter scores for, and this finds (or silently creates)
// the underlying ClassSubject teaching-unit row for their own class.
export const ensureClassSubject = async (req: Request, res: Response): Promise<Response> => {
  const { classId, subjectId } = req.body;

  if (!classId || !subjectId) {
    return res.status(400).json({ error: 'classId and subjectId are required.' });
  }

  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: req.user!.id },
    select: { id: true },
  });

  const cls = await prisma.class.findUnique({ where: { id: classId }, select: { formTeacherId: true } });

  if (!cls) {
    return res.status(404).json({ error: 'Class not found.' });
  }

  if (!teacherProfile || cls.formTeacherId !== teacherProfile.id) {
    return res.status(403).json({ error: 'You can only enter assessments for your own class.' });
  }

  try {
    const classSubject = await prisma.classSubject.upsert({
      where: { classId_subjectId: { classId, subjectId } },
      create: { classId, subjectId, teacherId: teacherProfile.id },
      update: { teacherId: teacherProfile.id },
      include: classSubjectInclude,
    });

    return res.status(200).json(shapeClassSubject(classSubject));
  } catch (error: any) {
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'That class or subject does not exist.' });
    }
    console.error('Ensure Class Subject Error:', error);
    return res.status(500).json({ error: 'Internal server error while preparing assessment entry.' });
  }
};

export const createClassSubject = async (req: Request, res: Response): Promise<Response> => {
  const { classId, subjectId, teacherId } = req.body;

  if (!classId || !subjectId) {
    return res.status(400).json({ error: 'classId and subjectId are required.' });
  }

  try {
    const classSubject = await prisma.classSubject.create({
      data: { classId, subjectId, teacherId: teacherId || null },
      include: classSubjectInclude,
    });

    return res.status(201).json(shapeClassSubject(classSubject));
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'This subject is already assigned to this class.' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'That class, subject, or teacher does not exist.' });
    }
    console.error('Create Class Subject Error:', error);
    return res.status(500).json({ error: 'Internal server error while assigning subject.' });
  }
};

export const updateClassSubject = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);
  const { teacherId } = req.body;

  try {
    const classSubject = await prisma.classSubject.update({
      where: { id },
      data: { teacherId: teacherId || null },
      include: classSubjectInclude,
    });

    return res.status(200).json(shapeClassSubject(classSubject));
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Assignment not found.' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'That teacher does not exist.' });
    }
    console.error('Update Class Subject Error:', error);
    return res.status(500).json({ error: 'Internal server error while updating assignment.' });
  }
};

export const deleteClassSubject = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);

  try {
    await prisma.classSubject.delete({ where: { id } });
    return res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Assignment not found.' });
    }
    if (error.code === 'P2003' || error.code === 'P2014') {
      return res.status(400).json({ error: 'Cannot remove this assignment while scores have been entered for it.' });
    }
    console.error('Delete Class Subject Error:', error);
    return res.status(500).json({ error: 'Internal server error while removing assignment.' });
  }
};
