import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { buildBillingResolver, summarizeBilling, totalBilled } from '../services/feeService';

// Total Expected Revenue and Fees Collected are lifetime totals — every
// academic year and every term that has ever existed, not just the one
// that's live right now. "Debtors" stays scoped to the current year/term
// though: whether someone owes money right now is inherently a present-tense
// question, not a historical one.
async function getFeeTotals() {
  const [academicYears, totalCollectedAgg] = await Promise.all([
    prisma.academicYear.findMany({ select: { id: true, name: true, isCurrent: true } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
  ]);

  if (academicYears.length === 0) {
    return { totalCollected: 0, totalDebtors: 0, totalExpected: 0, academicYearName: null, termName: null };
  }

  const currentYear = academicYears.find((y) => y.isCurrent) ?? null;
  const totalCollected = Number(totalCollectedAgg._sum.amount ?? 0);

  const students = await prisma.studentProfile.findMany({
    include: {
      enrollments: { where: { isActive: true }, take: 1, select: { class: { select: { category: true } } } },
    },
  });

  let totalExpected = 0;
  let totalDebtors = 0;
  let currentTermName: string | null = null;

  for (const year of academicYears) {
    const termsInYear = await prisma.term.findMany({
      where: { academicYearId: year.id },
      orderBy: { startDate: 'asc' },
      select: { id: true, name: true, isCurrent: true },
    });
    if (termsInYear.length === 0) continue;

    // A past year has no "current" term of its own (isCurrent is a single
    // global flag) — bill it through its own final term, since by now the
    // whole year has presumably run its course.
    const cutoffTerm = termsInYear.find((t) => t.isCurrent) ?? termsInYear[termsInYear.length - 1];
    if (year.isCurrent) currentTermName = termsInYear.find((t) => t.isCurrent)?.name ?? null;

    const [resolveBilling, paymentTotals] = await Promise.all([
      buildBillingResolver(year.id, cutoffTerm.id),
      prisma.payment.groupBy({ by: ['studentId'], where: { academicYearId: year.id }, _sum: { amount: true } }),
    ]);
    const collectedByStudent = new Map(paymentTotals.map((p) => [p.studentId, Number(p._sum.amount ?? 0)]));

    for (const s of students) {
      const activeClass = s.enrollments[0]?.class ?? null;
      const billing = resolveBilling({
        category: activeClass?.category ?? null,
        enrolmentTermId: s.enrolmentTermId,
        // An opening balance is a one-time override, not a per-year charge —
        // only count it once (against the current year) to avoid summing it
        // into every year's total when a school has multiple years on record.
        openingBalance: year.isCurrent ? Number(s.openingBalance) : 0,
      });
      const collected = collectedByStudent.get(s.id) ?? 0;
      const billed = totalBilled(billing);
      if (billed !== null) totalExpected += billed;

      if (year.isCurrent) {
        const summary = summarizeBilling(billing, collected);
        if (summary.status === 'PARTIAL' || summary.status === 'UNPAID') totalDebtors += 1;
      }
    }
  }

  return {
    totalCollected,
    totalDebtors,
    totalExpected,
    academicYearName: currentYear?.name ?? null,
    termName: currentTermName,
  };
}

// A teacher's dashboard only reports on the one class they're assigned to,
// not school-wide figures — those belong to ADMIN/SUPER_ADMIN only.
async function getTeacherDashboardStats(userId: string) {
  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId },
    select: { formClasses: { select: { id: true }, take: 1 } },
  });
  const classId = teacherProfile?.formClasses[0]?.id;

  if (!classId) {
    return { population: { total: 0, boys: 0, girls: 0 } };
  }

  const [total, boys, girls] = await Promise.all([
    prisma.enrollment.count({ where: { classId, isActive: true } }),
    prisma.enrollment.count({ where: { classId, isActive: true, student: { gender: 'MALE' } } }),
    prisma.enrollment.count({ where: { classId, isActive: true, student: { gender: 'FEMALE' } } }),
  ]);

  return { population: { total, boys, girls } };
}

export const getDashboardStats = async (req: Request, res: Response): Promise<Response> => {
  try {
    const role = req.user?.role;

    if (role === 'TEACHER') {
      return res.status(200).json(await getTeacherDashboardStats(req.user!.id));
    }

    // Fee visibility mirrors the Fees module itself, which is Super Admin only.
    const canSeeFees = role === 'SUPER_ADMIN';

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const [
      totalStudents,
      boys,
      girls,
      teaching,
      nonTeaching,
      newEnrollments,
      preSchoolClasses,
      primaryClasses,
      jhsClasses,
      feeTotals,
    ] = await Promise.all([
      prisma.studentProfile.count(),
      prisma.studentProfile.count({ where: { gender: 'MALE' } }),
      prisma.studentProfile.count({ where: { gender: 'FEMALE' } }),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } }),
      prisma.enrollment.count({ where: { enrolledAt: { gte: oneYearAgo } } }),
      // Counts every Class row individually, so e.g. "Grade 1 A" and "Grade 1 B" both count.
      prisma.class.count({ where: { category: 'PRE_SCHOOL' } }),
      prisma.class.count({ where: { category: 'PRIMARY' } }),
      prisma.class.count({ where: { category: 'JHS' } }),
      canSeeFees ? getFeeTotals() : Promise.resolve(null),
    ]);

    return res.status(200).json({
      population: { total: totalStudents, boys, girls },
      staff: { total: teaching + nonTeaching, teaching, nonTeaching },
      ...(feeTotals ? { fees: feeTotals } : {}),
      newEnrollments,
      classrooms: {
        total: preSchoolClasses + primaryClasses + jhsClasses,
        preSchool: preSchoolClasses,
        primary: primaryClasses,
        jhs: jhsClasses,
      },
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return res.status(500).json({ error: 'Internal server error while loading dashboard stats.' });
  }
};
