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

type TermResolution = { termId: string } | { error: string; status: number };

// Teachers never choose a term client-side — the UI locks to whatever term is
// currently active, and the server ignores any termId a teacher's request
// might carry and resolves it fresh from the DB. This is what actually stops
// a tampered payload from writing scores into a historical term: there is
// nothing for a teacher to tamper with, since their termId is never trusted.
// Admins/Super Admins are the documented override — they may target any term
// explicitly (e.g. to correct a closed term), so their termId is trusted.
async function resolveTermId(req: Request, requestedTermId?: string): Promise<TermResolution> {
  const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

  if (isStaff) {
    if (!requestedTermId) {
      return { error: 'termId is required.', status: 400 };
    }
    return { termId: requestedTermId };
  }

  const current = await prisma.term.findFirst({ where: { isCurrent: true }, select: { id: true } });
  if (!current) {
    return { error: 'No active term has been set. Ask an administrator to activate a term.', status: 409 };
  }
  return { termId: current.id };
}

// Roster for a class subject + term, with any existing score merged in.
export const listScores = async (req: Request, res: Response): Promise<Response> => {
  const { classSubjectId, termId } = req.query;

  if (!classSubjectId) {
    return res.status(400).json({ error: 'classSubjectId is required.' });
  }

  const permissionError = await assertCanEnterScores(req, String(classSubjectId));
  if (permissionError) {
    const status = permissionError === 'Class subject not found.' ? 404 : 403;
    return res.status(status).json({ error: permissionError });
  }

  const termResolution = await resolveTermId(req, termId ? String(termId) : undefined);
  if ('error' in termResolution) {
    return res.status(termResolution.status).json({ error: termResolution.error });
  }
  const resolvedTermId = termResolution.termId;

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
            where: { classSubjectId: String(classSubjectId), termId: resolvedTermId },
            select: { classScore: true, examScore: true, total: true, grade: true, remark: true },
          },
        },
      },
    },
    orderBy: { student: { user: { firstName: 'asc' } } },
  });

  return res.status(200).json({
    termId: resolvedTermId,
    students: enrollments.map((e) => {
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
  });
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

  if (!classSubjectId || !Array.isArray(scores)) {
    return res.status(400).json({ error: 'classSubjectId and scores[] are required.' });
  }

  const permissionError = await assertCanEnterScores(req, classSubjectId);
  if (permissionError) {
    const status = permissionError === 'Class subject not found.' ? 404 : 403;
    return res.status(status).json({ error: permissionError });
  }

  const termResolution = await resolveTermId(req, termId);
  if ('error' in termResolution) {
    return res.status(termResolution.status).json({ error: termResolution.error });
  }
  const resolvedTermId = termResolution.termId;

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
        // Show a running total as soon as either score is entered — missing
        // half counts as 0 for now rather than hiding the mark that IS in.
        const total = classScore !== null || examScore !== null ? (classScore ?? 0) * 0.4 + (examScore ?? 0) * 0.6 : null;

        return prisma.score.upsert({
          where: {
            studentId_classSubjectId_termId: {
              studentId: entry.studentId,
              classSubjectId,
              termId: resolvedTermId,
            },
          },
          create: {
            studentId: entry.studentId,
            classSubjectId,
            termId: resolvedTermId,
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

    return res.status(200).json({ message: 'Scores saved.', count: saved.length, termId: resolvedTermId });
  } catch (error: any) {
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'One of the students, class subject, or term does not exist.' });
    }
    console.error('Save Scores Error:', error);
    return res.status(500).json({ error: 'Internal server error while saving scores.' });
  }
};
