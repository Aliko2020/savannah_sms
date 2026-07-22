import { Request, Response } from 'express';
import { prisma } from '../config/db';

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

// Fee collection requires a finance data model that doesn't exist yet,
// so these are reported as zero until that's built.
export const getDashboardStats = async (req: Request, res: Response): Promise<Response> => {
  try {
    const role = req.user?.role;

    if (role === 'TEACHER') {
      return res.status(200).json(await getTeacherDashboardStats(req.user!.id));
    }

    const canSeeFees = role !== 'ADMIN';

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
    ]);

    return res.status(200).json({
      population: { total: totalStudents, boys, girls },
      staff: { total: teaching + nonTeaching, teaching, nonTeaching },
      ...(canSeeFees ? { fees: { totalCollected: 0, totalDebtors: 0 } } : {}),
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
