import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { ClassCategory } from '../generated/prisma/client';

export const listGradeLevels = async (req: Request, res: Response): Promise<Response> => {
  const gradeLevels = await prisma.gradeLevel.findMany({
    include: {
      promotesTo: { select: { id: true, name: true } },
      promotionRule: true,
      _count: { select: { classes: true } },
    },
    orderBy: { order: 'asc' },
  });

  return res.status(200).json(
    gradeLevels.map((gl) => ({
      id: gl.id,
      name: gl.name,
      category: gl.category,
      order: gl.order,
      promotesToId: gl.promotesToId,
      promotesTo: gl.promotesTo,
      promotionRule: gl.promotionRule,
      classCount: gl._count.classes,
    })),
  );
};

export const createGradeLevel = async (req: Request, res: Response): Promise<Response> => {
  const { name, category, order, promotesToId } = req.body;

  if (!name || !category || order === undefined || order === null) {
    return res.status(400).json({ error: 'name, category, and order are required.' });
  }

  if (!Object.values(ClassCategory).includes(category)) {
    return res.status(400).json({ error: 'Invalid category.' });
  }

  try {
    const gradeLevel = await prisma.gradeLevel.create({
      data: {
        name,
        category,
        order: Number(order),
        promotesToId: promotesToId || null,
      },
    });
    return res.status(201).json(gradeLevel);
  } catch (error: any) {
    if (error.code === 'P2002') {
      if (String(error.meta?.target).includes('order')) {
        return res.status(400).json({ error: 'A grade level with this order already exists.' });
      }
      return res.status(400).json({ error: 'A grade level with this name already exists.' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'That "promotes to" grade level does not exist.' });
    }
    console.error('Create Grade Level Error:', error);
    return res.status(500).json({ error: 'Internal server error while creating grade level.' });
  }
};

export const updateGradeLevel = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);
  const { name, category, order, promotesToId } = req.body;

  if (category && !Object.values(ClassCategory).includes(category)) {
    return res.status(400).json({ error: 'Invalid category.' });
  }

  if (promotesToId === id) {
    return res.status(400).json({ error: 'A grade level cannot promote into itself.' });
  }

  try {
    const updated = await prisma.gradeLevel.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(order !== undefined ? { order: Number(order) } : {}),
        ...(promotesToId !== undefined ? { promotesToId: promotesToId || null } : {}),
      },
    });
    return res.status(200).json(updated);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Grade level not found.' });
    }
    if (error.code === 'P2002') {
      if (String(error.meta?.target).includes('order')) {
        return res.status(400).json({ error: 'A grade level with this order already exists.' });
      }
      return res.status(400).json({ error: 'A grade level with this name already exists.' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'That "promotes to" grade level does not exist.' });
    }
    console.error('Update Grade Level Error:', error);
    return res.status(500).json({ error: 'Internal server error while updating grade level.' });
  }
};

export const deleteGradeLevel = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);

  try {
    await prisma.gradeLevel.delete({ where: { id } });
    return res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Grade level not found.' });
    }
    if (error.code === 'P2003' || error.code === 'P2014') {
      return res
        .status(400)
        .json({ error: 'Cannot delete a grade level that has classes assigned to it or is a promotion target.' });
    }
    console.error('Delete Grade Level Error:', error);
    return res.status(500).json({ error: 'Internal server error while deleting grade level.' });
  }
};
