import { Request, Response } from 'express';
import { prisma } from '../config/db';

async function assertCanEnterScores(req: Request, classSubjectId: string): Promise<string | null> {
  const classSubject = await prisma.classSubject.findUnique({
    where: { id: classSubjectId },
    select: { teacher: { select: { userId: true } } },
  });

  if (!classSubject) {
    return 'Class subject not found.';
  }

  const isOwner = req.user?.role === 'TEACHER' && classSubject.teacher?.userId === req.user.id;
  const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

  if (!isOwner && !isStaff) {
    return 'You do not have permission to manage scores for this class subject.';
  }

  return null;
}

// Roster for a class subject + term, with any existing score merged in.
export const listScores = async (req: Request, res: Response): Promise<Response> => {
  const { classSubjectId, termId } = req.query;

  if (!classSubjectId || !termId) {
    return res.status(400).json({ error: 'classSubjectId and termId are required.' });
  }

  const permissionError = await assertCanEnterScores(req, String(classSubjectId));
  if (permissionError) {
    const status = permissionError === 'Class subject not found.' ? 404 : 403;
    return res.status(status).json({ error: permissionError });
  }

  const classSubject = await prisma.classSubject.findUnique({
    where: { id: String(classSubjectId) },
    select: { classId: true },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { classId: classSubject!.classId, isActive: true },
    include: {
      student: {
        select: {
          id: true,
          admissionNumber: true,
          user: { select: { firstName: true, otherName: true, lastName: true } },
          scores: {
            where: { classSubjectId: String(classSubjectId), termId: String(termId) },
            select: { classScore: true, examScore: true, total: true, grade: true, remark: true },
          },
        },
      },
    },
    orderBy: { student: { user: { firstName: 'asc' } } },
  });

  return res.status(200).json(
    enrollments.map((e) => {
      const score = e.student.scores[0];
      return {
        studentId: e.student.id,
        admissionNumber: e.student.admissionNumber,
        firstName: e.student.user.firstName,
        otherName: e.student.user.otherName,
        lastName: e.student.user.lastName,
        // Prisma Decimal serializes to a string by default — convert to a real number.
        classScore: score?.classScore !== null && score?.classScore !== undefined ? Number(score.classScore) : null,
        examScore: score?.examScore !== null && score?.examScore !== undefined ? Number(score.examScore) : null,
        total: score?.total !== null && score?.total !== undefined ? Number(score.total) : null,
        grade: score?.grade ?? null,
        remark: score?.remark ?? null,
      };
    }),
  );
};

interface ScoreEntry {
  studentId: string;
  classScore?: number | null;
  examScore?: number | null;
  remark?: string | null;
}

export const saveScores = async (req: Request, res: Response): Promise<Response> => {
  const { classSubjectId, termId, scores } = req.body as {
    classSubjectId?: string;
    termId?: string;
    scores?: ScoreEntry[];
  };

  if (!classSubjectId || !termId || !Array.isArray(scores)) {
    return res.status(400).json({ error: 'classSubjectId, termId, and scores[] are required.' });
  }

  const permissionError = await assertCanEnterScores(req, classSubjectId);
  if (permissionError) {
    const status = permissionError === 'Class subject not found.' ? 404 : 403;
    return res.status(status).json({ error: permissionError });
  }

  // Teachers enter both class and exam scores on a raw 0-100 scale; the total
  // is where they get weighted down to a class:exam split of 40:60 out of 100.
  for (const entry of scores) {
    if (entry.classScore !== null && entry.classScore !== undefined && (entry.classScore < 0 || entry.classScore > 100)) {
      return res.status(400).json({ error: 'Class score must be between 0 and 100.' });
    }
    if (entry.examScore !== null && entry.examScore !== undefined && (entry.examScore < 0 || entry.examScore > 100)) {
      return res.status(400).json({ error: 'Exam score must be between 0 and 100.' });
    }
  }

  try {
    const saved = await prisma.$transaction(
      scores.map((entry) => {
        const classScore = entry.classScore !== null && entry.classScore !== undefined ? Number(entry.classScore) : null;
        const examScore = entry.examScore !== null && entry.examScore !== undefined ? Number(entry.examScore) : null;
        const total = classScore !== null && examScore !== null ? classScore * 0.4 + examScore * 0.6 : null;

        return prisma.score.upsert({
          where: {
            studentId_classSubjectId_termId: {
              studentId: entry.studentId,
              classSubjectId,
              termId,
            },
          },
          create: {
            studentId: entry.studentId,
            classSubjectId,
            termId,
            classScore,
            examScore,
            total,
            remark: entry.remark || null,
          },
          update: {
            classScore,
            examScore,
            total,
            remark: entry.remark || null,
          },
        });
      }),
    );

    return res.status(200).json({ message: 'Scores saved.', count: saved.length });
  } catch (error: any) {
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'One of the students, class subject, or term does not exist.' });
    }
    console.error('Save Scores Error:', error);
    return res.status(500).json({ error: 'Internal server error while saving scores.' });
  }
};
