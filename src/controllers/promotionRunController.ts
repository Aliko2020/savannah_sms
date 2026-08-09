import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { PromotionDecision, SectionStrategy } from '../generated/prisma/client';

const resultInclude = {
  student: {
    select: {
      id: true,
      admissionNumber: true,
      user: { select: { firstName: true, otherName: true, lastName: true } },
    },
  },
  fromClass: { select: { id: true, name: true } },
  toClass: { select: { id: true, name: true } },
} as const;

const runInclude = {
  fromAcademicYear: { select: { id: true, name: true } },
  toAcademicYear: { select: { id: true, name: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  _count: { select: { results: true } },
} as const;

export const listPromotionRuns = async (req: Request, res: Response): Promise<Response> => {
  const runs = await prisma.promotionRun.findMany({
    include: runInclude,
    orderBy: { createdAt: 'desc' },
  });
  return res.status(200).json(runs);
};

export const getPromotionRun = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);

  const run = await prisma.promotionRun.findUnique({
    where: { id },
    include: {
      ...runInclude,
      results: {
        include: resultInclude,
        orderBy: { student: { user: { firstName: 'asc' } } },
      },
    },
  });

  if (!run) {
    return res.status(404).json({ error: 'Promotion run not found.' });
  }

  return res.status(200).json(run);
};

// Step 2 — Results Engine. Computes each currently-enrolled student's
// cumulative average across every term of the source academic year, applies
// the applicable PromotionRule (grade-level override, else the school-wide
// default), and stages a DRAFT PromotionResult row per student. Nothing is
// enrolled or moved yet — that only happens on execution (Step 3).
export const createPromotionRun = async (req: Request, res: Response): Promise<Response> => {
  const { fromAcademicYearId, toAcademicYearId, sectionStrategy } = req.body;

  if (!fromAcademicYearId || !toAcademicYearId) {
    return res.status(400).json({ error: 'fromAcademicYearId and toAcademicYearId are required.' });
  }

  if (fromAcademicYearId === toAcademicYearId) {
    return res.status(400).json({ error: 'A promotion run must move students into a different academic year.' });
  }

  if (sectionStrategy && !Object.values(SectionStrategy).includes(sectionStrategy)) {
    return res.status(400).json({ error: 'Invalid sectionStrategy.' });
  }

  const [fromYear, toYear] = await Promise.all([
    prisma.academicYear.findUnique({ where: { id: fromAcademicYearId } }),
    prisma.academicYear.findUnique({ where: { id: toAcademicYearId } }),
  ]);
  if (!fromYear || !toYear) {
    return res.status(400).json({ error: 'That academic year does not exist.' });
  }

  const existingRun = await prisma.promotionRun.findUnique({
    where: { fromAcademicYearId_toAcademicYearId: { fromAcademicYearId, toAcademicYearId } },
  });
  if (existingRun) {
    return res.status(400).json({ error: `A promotion run from ${fromYear.name} to ${toYear.name} already exists.` });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { isActive: true, class: { academicYearId: fromAcademicYearId } },
    include: {
      class: {
        include: {
          gradeLevel: { include: { promotionRule: true } },
        },
      },
    },
  });

  if (enrollments.length === 0) {
    return res.status(400).json({ error: 'No enrolled students found in the source academic year.' });
  }

  const missingRuleGradeLevels = new Set<string>();
  const defaultRule = await prisma.promotionRule.findFirst({ where: { gradeLevelId: null } });
  for (const e of enrollments) {
    if (!e.class.gradeLevel.promotionRule && !defaultRule) {
      missingRuleGradeLevels.add(e.class.gradeLevel.name);
    }
  }
  if (missingRuleGradeLevels.size > 0) {
    return res.status(400).json({
      error: `No promotion rule configured for: ${Array.from(missingRuleGradeLevels).join(', ')}. Set a default rule or a per-grade override first.`,
    });
  }

  const terms = await prisma.term.findMany({
    where: { academicYearId: fromAcademicYearId },
    select: { id: true },
  });
  const termIds = terms.map((t) => t.id);

  const averages = await prisma.score.groupBy({
    by: ['studentId'],
    where: { studentId: { in: enrollments.map((e) => e.studentId) }, termId: { in: termIds }, total: { not: null } },
    _avg: { total: true },
  });
  const averageByStudent = new Map(averages.map((a) => [a.studentId, Number(a._avg.total)]));

  const skippedNoScores: string[] = [];
  const results: {
    studentId: string;
    fromClassId: string;
    cumulativeAverage: number;
    decision: PromotionDecision;
    targetGradeLevelId: string | null;
  }[] = [];

  for (const e of enrollments) {
    const average = averageByStudent.get(e.studentId);
    if (average === undefined) {
      skippedNoScores.push(e.studentId);
      continue;
    }

    const rule = e.class.gradeLevel.promotionRule ?? defaultRule!;
    const promoteMin = Number(rule.promoteMinAverage);
    const probationMin = Number(rule.probationMinAverage);
    const gl = e.class.gradeLevel;

    let decision: PromotionDecision;
    let targetGradeLevelId: string | null;

    if (average >= promoteMin) {
      decision = gl.promotesToId ? 'PROMOTED' : 'GRADUATED';
      targetGradeLevelId = gl.promotesToId;
    } else if (average >= probationMin) {
      decision = 'PROBATION';
      targetGradeLevelId = rule.probationPromotes ? gl.promotesToId : gl.id;
    } else {
      decision = 'REPEATED';
      targetGradeLevelId = gl.id;
    }

    results.push({
      studentId: e.studentId,
      fromClassId: e.classId,
      cumulativeAverage: average,
      decision,
      targetGradeLevelId,
    });
  }

  if (results.length === 0) {
    return res.status(400).json({ error: 'No enrolled students have recorded scores for this academic year yet.' });
  }

  const run = await prisma.$transaction(async (tx) => {
    const created = await tx.promotionRun.create({
      data: {
        fromAcademicYearId,
        toAcademicYearId,
        sectionStrategy: sectionStrategy || null,
        createdById: req.user!.id,
      },
    });

    await tx.promotionResult.createMany({
      data: results.map((r) => ({ ...r, promotionRunId: created.id })),
    });

    return created;
  });

  const full = await prisma.promotionRun.findUnique({
    where: { id: run.id },
    include: {
      ...runInclude,
      results: { include: resultInclude, orderBy: { student: { user: { firstName: 'asc' } } } },
    },
  });

  return res.status(201).json({ run: full, skippedStudentCount: skippedNoScores.length });
};

// Admin adjustment before execution — e.g. bump a borderline PROBATION
// student to PROMOTED, or manually retain someone the engine passed.
export const overridePromotionResult = async (req: Request, res: Response): Promise<Response> => {
  const runId = String(req.params.id);
  const resultId = String(req.params.resultId);
  const { decision, targetGradeLevelId } = req.body;

  if (decision && !Object.values(PromotionDecision).includes(decision)) {
    return res.status(400).json({ error: 'Invalid decision.' });
  }

  const run = await prisma.promotionRun.findUnique({ where: { id: runId } });
  if (!run) {
    return res.status(404).json({ error: 'Promotion run not found.' });
  }
  if (run.status !== 'DRAFT') {
    return res.status(400).json({ error: 'Only draft runs can be edited.' });
  }

  const existing = await prisma.promotionResult.findFirst({ where: { id: resultId, promotionRunId: runId } });
  if (!existing) {
    return res.status(404).json({ error: 'Promotion result not found.' });
  }

  const updated = await prisma.promotionResult.update({
    where: { id: resultId },
    data: {
      ...(decision !== undefined ? { decision } : {}),
      ...(targetGradeLevelId !== undefined ? { targetGradeLevelId: targetGradeLevelId || null } : {}),
      decisionOverridden: true,
    },
    include: resultInclude,
  });
  return res.status(200).json(updated);
};

// Step 3 — Execution. Resolves each staged result's target class according
// to the chosen section strategy, then atomically deactivates every old
// enrollment, creates the new ones, records the resolved toClassId on each
// result, and flips the run to EXECUTED. Nothing here is reversible through
// the API — a bad run must be fixed by a fresh promotion in the other
// direction, same as any other enrollment change.
export const executePromotionRun = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);
  const bodyStrategy = req.body?.sectionStrategy;

  const run = await prisma.promotionRun.findUnique({
    where: { id },
    include: {
      results: {
        include: { fromClass: { select: { id: true, name: true, gradeLevelId: true } } },
      },
    },
  });

  if (!run) {
    return res.status(404).json({ error: 'Promotion run not found.' });
  }
  if (run.status !== 'DRAFT') {
    return res.status(400).json({ error: 'This run has already been executed.' });
  }
  if (run.results.length === 0) {
    return res.status(400).json({ error: 'This run has no staged results to execute.' });
  }

  const results = run.results;

  const strategy: SectionStrategy | null = bodyStrategy || run.sectionStrategy;
  if (!strategy || !Object.values(SectionStrategy).includes(strategy)) {
    return res
      .status(400)
      .json({ error: 'A valid sectionStrategy (MAINTAIN_STREAM, AUTO_DISTRIBUTE, or UNASSIGNED_POOL) is required to execute.' });
  }

  // Every non-GRADUATED result needs at least one class to land in.
  const neededGradeLevelIds = Array.from(
    new Set(results.filter((r) => r.targetGradeLevelId).map((r) => r.targetGradeLevelId as string)),
  );

  const targetClasses = await prisma.class.findMany({
    where: { academicYearId: run.toAcademicYearId, gradeLevelId: { in: neededGradeLevelIds } },
    select: { id: true, name: true, gradeLevelId: true },
  });

  const classesByGradeLevel = new Map<string, { id: string; name: string; gradeLevelId: string }[]>();
  for (const c of targetClasses) {
    const list = classesByGradeLevel.get(c.gradeLevelId) ?? [];
    list.push(c);
    classesByGradeLevel.set(c.gradeLevelId, list);
  }

  const missingGradeLevelIds = neededGradeLevelIds.filter((glId) => !classesByGradeLevel.get(glId)?.length);
  if (missingGradeLevelIds.length > 0) {
    const missing = await prisma.gradeLevel.findMany({
      where: { id: { in: missingGradeLevelIds } },
      select: { name: true },
    });
    return res.status(400).json({
      error: `No class exists in the target academic year for: ${missing.map((g) => g.name).join(', ')}. Create it first.`,
    });
  }

  const gradeLevels = await prisma.gradeLevel.findMany({
    where: { id: { in: [...neededGradeLevelIds, ...results.map((r) => r.fromClass.gradeLevelId)] } },
    select: { id: true, name: true },
  });
  const gradeLevelNameById = new Map(gradeLevels.map((g) => [g.id, g.name]));

  // "Grade 1A" under grade level "Grade 1" -> stream token "a". Bare names
  // with no stream suffix all resolve to "", which never matches, so those
  // fall through to unassigned rather than guessing.
  function streamToken(className: string, gradeLevelName: string): string {
    const trimmed = className.startsWith(gradeLevelName) ? className.slice(gradeLevelName.length) : className;
    return trimmed.trim().toLowerCase();
  }

  const fillCounts = new Map<string, number>();
  if (strategy === 'AUTO_DISTRIBUTE') {
    const counts = await prisma.enrollment.groupBy({
      by: ['classId'],
      where: { classId: { in: targetClasses.map((c) => c.id) }, isActive: true },
      _count: { _all: true },
    });
    for (const c of targetClasses) fillCounts.set(c.id, 0);
    for (const row of counts) fillCounts.set(row.classId, row._count._all);
  }

  function resolveTargetClassId(result: (typeof results)[number]): string | null {
    if (!result.targetGradeLevelId) return null; // GRADUATED — no destination class
    const candidates = classesByGradeLevel.get(result.targetGradeLevelId) ?? [];
    if (candidates.length === 0) return null; // guarded against above
    if (candidates.length === 1) return candidates[0].id;
    if (strategy === 'UNASSIGNED_POOL') return null;

    if (strategy === 'MAINTAIN_STREAM') {
      const fromToken = streamToken(result.fromClass.name, gradeLevelNameById.get(result.fromClass.gradeLevelId) ?? '');
      if (!fromToken) return null;
      const toGradeLevelName = gradeLevelNameById.get(result.targetGradeLevelId) ?? '';
      const match = candidates.find((c) => streamToken(c.name, toGradeLevelName) === fromToken);
      return match ? match.id : null;
    }

    // AUTO_DISTRIBUTE — send to whichever candidate currently has the fewest students.
    let best = candidates[0];
    for (const c of candidates) {
      if ((fillCounts.get(c.id) ?? 0) < (fillCounts.get(best.id) ?? 0)) best = c;
    }
    fillCounts.set(best.id, (fillCounts.get(best.id) ?? 0) + 1);
    return best.id;
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const result of results) {
        const toClassId = resolveTargetClassId(result);

        await tx.enrollment.updateMany({
          where: { studentId: result.studentId, classId: result.fromClassId, isActive: true },
          data: { isActive: false },
        });

        if (toClassId) {
          await tx.enrollment.create({ data: { studentId: result.studentId, classId: toClassId, isActive: true } });
        }

        await tx.promotionResult.update({ where: { id: result.id }, data: { toClassId } });
      }

      await tx.promotionRun.update({
        where: { id: run.id },
        data: { status: 'EXECUTED', executedAt: new Date(), sectionStrategy: strategy },
      });
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A student in this run is already enrolled in their target class.' });
    }
    console.error('Execute Promotion Run Error:', error);
    return res.status(500).json({ error: 'Internal server error while executing promotion run.' });
  }

  const full = await prisma.promotionRun.findUnique({
    where: { id: run.id },
    include: {
      ...runInclude,
      results: { include: resultInclude, orderBy: { student: { user: { firstName: 'asc' } } } },
    },
  });

  return res.status(200).json(full);
};

// Discard a draft run so the admin can fix scores/rules and recompute.
export const deletePromotionRun = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);

  const run = await prisma.promotionRun.findUnique({ where: { id } });
  if (!run) {
    return res.status(404).json({ error: 'Promotion run not found.' });
  }
  if (run.status !== 'DRAFT') {
    return res.status(400).json({ error: 'Cannot delete a run that has already been executed.' });
  }

  await prisma.promotionRun.delete({ where: { id } });
  return res.status(204).send();
};
