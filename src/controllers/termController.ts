import { Request, Response } from 'express';
import { prisma } from '../config/db';

export const listTerms = async (req: Request, res: Response): Promise<Response> => {
  const { academicYearId } = req.query;

  const terms = await prisma.term.findMany({
    where: academicYearId ? { academicYearId: String(academicYearId) } : undefined,
    orderBy: { startDate: 'asc' },
  });

  return res.status(200).json(terms);
};

export const createTerm = async (req: Request, res: Response): Promise<Response> => {
  const { name, academicYearId, startDate, endDate, isCurrent } = req.body;

  if (!name || !academicYearId || !startDate || !endDate) {
    return res.status(400).json({ error: 'name, academicYearId, startDate, and endDate are required.' });
  }

  try {
    const term = await prisma.$transaction(async (tx) => {
      if (isCurrent) {
        await tx.term.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
      }
      return tx.term.create({
        data: {
          name,
          academicYearId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isCurrent: !!isCurrent,
        },
      });
    });

    return res.status(201).json(term);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A term with this name already exists for that academic year.' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'That academic year does not exist.' });
    }
    console.error('Create Term Error:', error);
    return res.status(500).json({ error: 'Internal server error while creating term.' });
  }
};
