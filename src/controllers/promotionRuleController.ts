import { Request, Response } from 'express';
import { prisma } from '../config/db';

function validateThresholds(promoteMinAverage: unknown, probationMinAverage: unknown): string | null {
  const promote = Number(promoteMinAverage);
  const probation = Number(probationMinAverage);
  if (Number.isNaN(promote) || Number.isNaN(probation)) {
    return 'promoteMinAverage and probationMinAverage must be numbers.';
  }
  if (promote < 0 || promote > 100 || probation < 0 || probation > 100) {
    return 'Thresholds must be between 0 and 100.';
  }
  if (probation > promote) {
    return 'probationMinAverage cannot be higher than promoteMinAverage.';
  }
  return null;
}

// Every rule in the table, default (gradeLevelId null) first.
export const listPromotionRules = async (req: Request, res: Response): Promise<Response> => {
  const rules = await prisma.promotionRule.findMany({
    include: { gradeLevel: { select: { id: true, name: true } } },
    orderBy: { gradeLevel: { order: 'asc' } },
  });
  return res.status(200).json(rules);
};

// Single default rule used by any grade level without its own override.
// There is at most one — find-then-update instead of relying on a DB
// constraint, since Postgres treats multiple NULLs as distinct under a
// unique index.
export const upsertDefaultPromotionRule = async (req: Request, res: Response): Promise<Response> => {
  const { promoteMinAverage, probationMinAverage, probationPromotes } = req.body;

  const validationError = validateThresholds(promoteMinAverage, probationMinAverage);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const existing = await prisma.promotionRule.findFirst({ where: { gradeLevelId: null } });

  const data = {
    promoteMinAverage: Number(promoteMinAverage),
    probationMinAverage: Number(probationMinAverage),
    probationPromotes: probationPromotes ?? true,
  };

  const rule = existing
    ? await prisma.promotionRule.update({ where: { id: existing.id }, data })
    : await prisma.promotionRule.create({ data: { ...data, gradeLevelId: null } });

  return res.status(200).json(rule);
};

export const upsertGradeLevelPromotionRule = async (req: Request, res: Response): Promise<Response> => {
  const gradeLevelId = String(req.params.gradeLevelId);
  const { promoteMinAverage, probationMinAverage, probationPromotes } = req.body;

  const validationError = validateThresholds(promoteMinAverage, probationMinAverage);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const rule = await prisma.promotionRule.upsert({
      where: { gradeLevelId },
      update: {
        promoteMinAverage: Number(promoteMinAverage),
        probationMinAverage: Number(probationMinAverage),
        probationPromotes: probationPromotes ?? true,
      },
      create: {
        gradeLevelId,
        promoteMinAverage: Number(promoteMinAverage),
        probationMinAverage: Number(probationMinAverage),
        probationPromotes: probationPromotes ?? true,
      },
    });
    return res.status(200).json(rule);
  } catch (error: any) {
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'That grade level does not exist.' });
    }
    console.error('Upsert Grade Level Promotion Rule Error:', error);
    return res.status(500).json({ error: 'Internal server error while saving promotion rule.' });
  }
};

export const deleteGradeLevelPromotionRule = async (req: Request, res: Response): Promise<Response> => {
  const gradeLevelId = String(req.params.gradeLevelId);

  try {
    await prisma.promotionRule.delete({ where: { gradeLevelId } });
    return res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'No override exists for this grade level.' });
    }
    console.error('Delete Grade Level Promotion Rule Error:', error);
    return res.status(500).json({ error: 'Internal server error while deleting promotion rule.' });
  }
};
