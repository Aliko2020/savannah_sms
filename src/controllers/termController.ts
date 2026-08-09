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

// The single globally-active term (isCurrent is a singleton, set by createTerm).
// Teacher-facing entry screens use this instead of letting the teacher pick a
// term, so it always reflects whatever the admin has activated.
export const getCurrentTerm = async (_req: Request, res: Response): Promise<Response> => {
  const term = await prisma.term.findFirst({
    where: { isCurrent: true },
    include: { academicYear: { select: { id: true, name: true } } },
  });

  if (!term) {
    return res.status(404).json({ error: 'No active term has been set. Ask an administrator to activate a term.' });
  }

  return res.status(200).json(term);
};

export const updateTerm = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);
  const { name, startDate, endDate, isCurrent } = req.body;

  const existing = await prisma.term.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: 'Term not found.' });
  }

  const newStart = startDate ? new Date(startDate) : existing.startDate;
  const newEnd = endDate ? new Date(endDate) : existing.endDate;
  if (newEnd <= newStart) {
    return res.status(400).json({ error: 'End date must be after the start date.' });
  }

  const siblingTerms = await prisma.term.findMany({
    where: { academicYearId: existing.academicYearId, id: { not: id } },
    select: { name: true, startDate: true, endDate: true },
  });

  const overlapping = siblingTerms.find((t) => newStart <= t.endDate && newEnd >= t.startDate);
  if (overlapping) {
    return res.status(400).json({
      error: `These dates overlap with ${overlapping.name} (${overlapping.startDate.toISOString().slice(0, 10)} to ${overlapping.endDate.toISOString().slice(0, 10)}).`,
    });
  }

  try {
    const term = await prisma.$transaction(async (tx) => {
      if (isCurrent) {
        await tx.term.updateMany({ where: { isCurrent: true, id: { not: id } }, data: { isCurrent: false } });
      }
      return tx.term.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(startDate !== undefined ? { startDate: newStart } : {}),
          ...(endDate !== undefined ? { endDate: newEnd } : {}),
          ...(isCurrent !== undefined ? { isCurrent: !!isCurrent } : {}),
        },
      });
    });

    return res.status(200).json(term);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A term with this name already exists for that academic year.' });
    }
    console.error('Update Term Error:', error);
    return res.status(500).json({ error: 'Internal server error while updating term.' });
  }
};

export const createTerm = async (req: Request, res: Response): Promise<Response> => {
  const { name, academicYearId, startDate, endDate, isCurrent } = req.body;

  if (!name || !academicYearId || !startDate || !endDate) {
    return res.status(400).json({ error: 'name, academicYearId, startDate, and endDate are required.' });
  }

  const newStart = new Date(startDate);
  const newEnd = new Date(endDate);
  if (newEnd <= newStart) {
    return res.status(400).json({ error: 'End date must be after the start date.' });
  }

  const existingTerms = await prisma.term.findMany({
    where: { academicYearId },
    select: { name: true, startDate: true, endDate: true },
  });

  if (existingTerms.length >= 3) {
    return res.status(400).json({ error: 'An academic year can have at most 3 terms.' });
  }

  // Standard interval overlap check: two ranges overlap unless one ends
  // before the other starts.
  const overlapping = existingTerms.find((t) => newStart <= t.endDate && newEnd >= t.startDate);
  if (overlapping) {
    return res.status(400).json({
      error: `These dates overlap with ${overlapping.name} (${overlapping.startDate.toISOString().slice(0, 10)} to ${overlapping.endDate.toISOString().slice(0, 10)}).`,
    });
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
