import { Request, Response } from 'express';
import { prisma } from '../config/db';

// 90-100=Excellent, 80-89=Very Good, 70-79=Good, 60-69=Credit, 50-59=Pass,
// 40-49=Weak, 0-39=Very Weak — printed on every report card as the legend,
// so the bands live here once and the legend text must stay in sync with them.
function gradeRemark(total: number): string {
  if (total >= 90) return 'Excellent';
  if (total >= 80) return 'Very Good';
  if (total >= 70) return 'Good';
  if (total >= 60) return 'Credit';
  if (total >= 50) return 'Pass';
  if (total >= 40) return 'Weak';
  return 'Very Weak';
}

// "Promoted To" is a year-end decision, so it only belongs on the academic
// year's last term — keyed off the term's name rather than "is there a
// later term already in the system", since Second/Third Term often aren't
// created yet at the point First Term's reports are being printed.
function isFinalTermName(termName: string): boolean {
  const normalized = termName.trim().toLowerCase();
  return !normalized.startsWith('first term') && !normalized.startsWith('second term');
}

function ordinal(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return `${n}st`;
  if (j === 2 && k !== 12) return `${n}nd`;
  if (j === 3 && k !== 13) return `${n}rd`;
  return `${n}th`;
}

// Standard competition ranking (ties share a rank; the next distinct score
// skips ahead by however many students tied for the rank before it).
function computeRanks(entries: { id: string; score: number }[]): Map<string, number> {
  const sorted = [...entries].sort((a, b) => b.score - a.score);
  const ranks = new Map<string, number>();
  let rank = 0;
  let prevScore: number | null = null;
  let seen = 0;
  for (const entry of sorted) {
    seen += 1;
    if (entry.score !== prevScore) {
      rank = seen;
      prevScore = entry.score;
    }
    ranks.set(entry.id, rank);
  }
  return ranks;
}

// Everything shared between a single student's report card and a whole
// class's bulk print run: the class roster, subjects, and every classmate's
// scores for the term — computed once regardless of how many cards are built from it.
async function loadClassReportContext(classId: string, termId: string) {
  const term = await prisma.term.findUnique({
    where: { id: termId },
    include: { academicYear: { select: { id: true, name: true } } },
  });
  if (!term) return null;

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    select: { id: true, name: true, formTeacher: { select: { userId: true } } },
  });
  if (!cls) return null;

  const classSubjects = await prisma.classSubject.findMany({
    where: { classId },
    include: {
      subject: { select: { name: true } },
      teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
    },
    orderBy: { subject: { name: 'asc' } },
  });
  const classSubjectIds = classSubjects.map((cs) => cs.id);

  // Not filtered to isActive: true — a Class is a homeroom for ONE academic
  // year (never reused across years), so every Enrollment row against this
  // classId genuinely belongs to it regardless of whether that student has
  // since been promoted into a different class. isActive only means "is
  // this their *current* class" — irrelevant for a report card, which is
  // inherently a snapshot of one specific class in one specific past term.
  // Filtering on it here was the bug: promoting a student flips their old
  // enrollment to isActive: false, which silently broke their own historical
  // report card (and shrank "No. On Roll" for everyone else in that old class).
  const enrollments = await prisma.enrollment.findMany({
    where: { classId },
    include: {
      student: {
        select: {
          id: true,
          admissionNumber: true,
          gender: true,
          user: { select: { firstName: true, otherName: true, lastName: true } },
          scores: {
            where: { termId, classSubjectId: { in: classSubjectIds } },
            select: { classSubjectId: true, classScore: true, examScore: true, total: true },
          },
        },
      },
    },
    orderBy: { student: { user: { firstName: 'asc' } } },
  });

  // Per-subject ranks, computed across every classmate who has a total for that subject.
  const subjectRanks = new Map<string, Map<string, number>>();
  for (const cs of classSubjects) {
    const entries = enrollments
      .map((e) => {
        const score = e.student.scores.find((s) => s.classSubjectId === cs.id);
        return score?.total !== null && score?.total !== undefined ? { id: e.student.id, score: Number(score.total) } : null;
      })
      .filter((e): e is { id: string; score: number } => e !== null);
    subjectRanks.set(cs.id, computeRanks(entries));
  }

  // Overall rank, by each classmate's average across the subjects they have totals for.
  const averageEntries = enrollments
    .map((e) => {
      const totals = e.student.scores.filter((s) => s.total !== null).map((s) => Number(s.total));
      if (totals.length === 0) return null;
      return { id: e.student.id, score: totals.reduce((a, b) => a + b, 0) / totals.length };
    })
    .filter((e): e is { id: string; score: number } => e !== null);
  const overallRanks = computeRanks(averageEntries);

  const nextTerm = await prisma.term.findFirst({
    where: { academicYearId: term.academicYearId, startDate: { gt: term.startDate } },
    orderBy: { startDate: 'asc' },
    select: { startDate: true },
  });

  // Cumulative average for every student at once: their per-term average,
  // averaged again across every term in the academic year up to and
  // including the selected one — reduces to Average Score when this is the
  // only term with recorded scores so far.
  const termsSoFar = await prisma.term.findMany({
    where: { academicYearId: term.academicYearId, startDate: { lte: term.startDate } },
    select: { id: true },
  });
  const cumulativeScores = await prisma.score.findMany({
    where: {
      studentId: { in: enrollments.map((e) => e.student.id) },
      classSubjectId: { in: classSubjectIds },
      termId: { in: termsSoFar.map((t) => t.id) },
      total: { not: null },
    },
    select: { studentId: true, termId: true, total: true },
  });
  const byStudentTerm = new Map<string, Map<string, number[]>>();
  for (const s of cumulativeScores) {
    if (!byStudentTerm.has(s.studentId)) byStudentTerm.set(s.studentId, new Map());
    const termMap = byStudentTerm.get(s.studentId)!;
    if (!termMap.has(s.termId)) termMap.set(s.termId, []);
    termMap.get(s.termId)!.push(Number(s.total));
  }
  const cumulativeAverages = new Map<string, number | null>();
  for (const e of enrollments) {
    const termMap = byStudentTerm.get(e.student.id);
    if (!termMap || termMap.size === 0) {
      cumulativeAverages.set(e.student.id, null);
      continue;
    }
    const termAverages = Array.from(termMap.values()).map((totals) => totals.reduce((a, b) => a + b, 0) / totals.length);
    cumulativeAverages.set(e.student.id, termAverages.reduce((a, b) => a + b, 0) / termAverages.length);
  }

  return {
    term,
    cls,
    classSubjects,
    classSubjectIds,
    enrollments,
    subjectRanks,
    overallRanks,
    averageEntries,
    cumulativeAverages,
    noOnRoll: enrollments.length,
    nextTermBeginDate: nextTerm?.startDate ?? null,
    isFinalTerm: isFinalTermName(term.name),
  };
}

type ReportContext = NonNullable<Awaited<ReturnType<typeof loadClassReportContext>>>;

function buildStudentCard(ctx: ReportContext, studentId: string) {
  const enrollment = ctx.enrollments.find((e) => e.student.id === studentId);
  if (!enrollment) return null;
  const student = enrollment.student;

  const subjects = ctx.classSubjects.map((cs) => {
    const score = student.scores.find((s) => s.classSubjectId === cs.id);
    const total = score?.total !== null && score?.total !== undefined ? Number(score.total) : null;
    const rank = total !== null ? ctx.subjectRanks.get(cs.id)?.get(studentId) ?? null : null;
    return {
      subjectName: cs.subject.name,
      classScore: score?.classScore !== null && score?.classScore !== undefined ? Number(score.classScore) : null,
      examScore: score?.examScore !== null && score?.examScore !== undefined ? Number(score.examScore) : null,
      total,
      position: rank !== null ? ordinal(rank) : null,
      remark: total !== null ? gradeRemark(total) : null,
      teacherFirstName: cs.teacher?.user.firstName ?? null,
      teacherLastName: cs.teacher?.user.lastName ?? null,
    };
  });

  const averageScore = ctx.averageEntries.find((e) => e.id === studentId)?.score ?? null;
  const overallRank = averageScore !== null ? ctx.overallRanks.get(studentId) ?? null : null;

  return {
    student: {
      id: student.id,
      admissionNumber: student.admissionNumber,
      firstName: student.user.firstName,
      otherName: student.user.otherName,
      lastName: student.user.lastName,
      gender: student.gender,
    },
    academicYear: ctx.term.academicYear,
    term: { id: ctx.term.id, name: ctx.term.name },
    class: { id: ctx.cls.id, name: ctx.cls.name },
    noOnRoll: ctx.noOnRoll,
    nextTermBeginDate: ctx.nextTermBeginDate,
    isFinalTerm: ctx.isFinalTerm,
    averageScore,
    positionInClass: overallRank !== null ? ordinal(overallRank) : null,
    cumulativeAverage: ctx.cumulativeAverages.get(studentId) ?? null,
    subjects,
  };
}

export const getStudentReportCard = async (req: Request, res: Response): Promise<Response> => {
  const studentId = String(req.params.id);
  const { termId } = req.query;

  if (!termId) {
    return res.status(400).json({ error: 'termId is required.' });
  }

  const term = await prisma.term.findUnique({ where: { id: String(termId) }, select: { academicYearId: true } });
  if (!term) {
    return res.status(404).json({ error: 'Term not found.' });
  }

  // Class is resolved for the report's academic year specifically (not just
  // "currently active") so a report card can still be reprinted for a past
  // year after the student has moved on to a new class. Ordered by
  // enrolledAt so this stays deterministic even in the edge case of two
  // enrollments landing in the same academic year — the earliest one is the
  // class this student actually belonged to first.
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId, class: { academicYearId: term.academicYearId } },
    orderBy: { enrolledAt: 'asc' },
    select: { classId: true },
  });
  if (!enrollment) {
    return res.status(404).json({ error: 'This student has no class in that academic year.' });
  }

  const ctx = await loadClassReportContext(enrollment.classId, String(termId));
  if (!ctx) {
    return res.status(404).json({ error: 'Class or term not found.' });
  }

  const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
  const isFormTeacher = req.user?.role === 'TEACHER' && ctx.cls.formTeacher?.userId === req.user.id;
  if (!isStaff && !isFormTeacher) {
    return res.status(403).json({ error: 'You do not have permission to view this report card.' });
  }

  const card = buildStudentCard(ctx, studentId);
  if (!card) {
    return res.status(404).json({ error: 'This student is not actively enrolled in that class.' });
  }

  return res.status(200).json(card);
};

// Bulk print: one report card per active student in the class, for a
// class teacher / admin running off the whole class at once instead of
// student-by-student. Staff-only — this is an administrative print run,
// not something scoped to a single teacher's own class.
export const getClassReportCards = async (req: Request, res: Response): Promise<Response> => {
  const classId = String(req.params.id);
  const { termId } = req.query;

  if (!termId) {
    return res.status(400).json({ error: 'termId is required.' });
  }

  const ctx = await loadClassReportContext(classId, String(termId));
  if (!ctx) {
    return res.status(404).json({ error: 'Class or term not found.' });
  }

  const students = ctx.enrollments
    .map((e) => buildStudentCard(ctx, e.student.id))
    .filter((card): card is NonNullable<typeof card> => card !== null);

  return res.status(200).json({ class: ctx.cls, term: { id: ctx.term.id, name: ctx.term.name }, students });
};
