import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { ClassCategory } from '../generated/prisma/client';

export const listSubjects = async (req: Request, res: Response): Promise<Response> => {
  const { category } = req.query;

  const subjects = await prisma.subject.findMany({
    where: category ? { category: String(category) as ClassCategory } : undefined,
    orderBy: { name: 'asc' },
  });

  return res.status(200).json(subjects);
};

export const createSubject = async (req: Request, res: Response): Promise<Response> => {
  const { name, code, category } = req.body;

  if (!name || !code || !category) {
    return res.status(400).json({ error: 'name, code, and category are required.' });
  }

  if (!Object.values(ClassCategory).includes(category)) {
    return res.status(400).json({ error: 'Invalid category.' });
  }

  try {
    const subject = await prisma.subject.create({ data: { name, code, category } });
    return res.status(201).json(subject);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A subject with this name or code already exists.' });
    }
    console.error('Create Subject Error:', error);
    return res.status(500).json({ error: 'Internal server error while creating subject.' });
  }
};

export const updateSubject = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);
  const { name, code, category } = req.body;

  if (category && !Object.values(ClassCategory).includes(category)) {
    return res.status(400).json({ error: 'Invalid category.' });
  }

  try {
    const updated = await prisma.subject.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(code !== undefined ? { code } : {}),
        ...(category !== undefined ? { category } : {}),
      },
    });

    return res.status(200).json(updated);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Subject not found.' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A subject with this name or code already exists.' });
    }
    console.error('Update Subject Error:', error);
    return res.status(500).json({ error: 'Internal server error while updating subject.' });
  }
};

export const deleteSubject = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);

  try {
    await prisma.subject.delete({ where: { id } });
    return res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Subject not found.' });
    }
    if (error.code === 'P2003' || error.code === 'P2014') {
      return res.status(400).json({ error: 'Cannot delete a subject that is assigned to a class.' });
    }
    console.error('Delete Subject Error:', error);
    return res.status(500).json({ error: 'Internal server error while deleting subject.' });
  }
};
