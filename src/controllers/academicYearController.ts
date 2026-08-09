import { Request, Response } from 'express';
import { prisma } from '../config/db';

export const listAcademicYears = async (_req: Request, res: Response): Promise<Response> => {
  const academicYears = await prisma.academicYear.findMany({ orderBy: { name: 'desc' } });
  return res.status(200).json(academicYears);
};

export const createAcademicYear = async (req: Request, res: Response): Promise<Response> => {
  const { name, isCurrent } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name is required.' });
  }

  try {
    const academicYear = await prisma.$transaction(async (tx) => {
      if (isCurrent) {
        await tx.academicYear.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
      }
      return tx.academicYear.create({ data: { name, isCurrent: !!isCurrent } });
    });

    return res.status(201).json(academicYear);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'An academic year with this name already exists.' });
    }
    console.error('Create Academic Year Error:', error);
    return res.status(500).json({ error: 'Internal server error while creating academic year.' });
  }
};

// Lets an admin flip which academic year is "current" — the year Promotion
// Setup creates deliberately starts as isCurrent: false so its classes/terms
// can be prepped ahead of time without disrupting the still-active year's
// billing and dashboards; this is the step that switches over once a
// promotion run has finished moving students into it.
export const updateAcademicYear = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);
  const { name, isCurrent } = req.body;

  const existing = await prisma.academicYear.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: 'Academic year not found.' });
  }

  try {
    const academicYear = await prisma.$transaction(async (tx) => {
      if (isCurrent) {
        await tx.academicYear.updateMany({ where: { isCurrent: true, id: { not: id } }, data: { isCurrent: false } });
      }
      return tx.academicYear.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(isCurrent !== undefined ? { isCurrent: !!isCurrent } : {}),
        },
      });
    });

    return res.status(200).json(academicYear);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'An academic year with this name already exists.' });
    }
    console.error('Update Academic Year Error:', error);
    return res.status(500).json({ error: 'Internal server error while updating academic year.' });
  }
};
