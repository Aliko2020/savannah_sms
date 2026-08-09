import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { ClassCategory } from '../generated/prisma/client';
import { ensureStandardSubjects } from '../services/subjectSeedService';

export const listSubjects = async (req: Request, res: Response): Promise<Response> => {
  const { category } = req.query;

  const subjects = await prisma.subject.findMany({
    where: category ? { categories: { has: String(category) as ClassCategory } } : undefined,
    orderBy: { name: 'asc' },
  });

  return res.status(200).json(subjects);
};

function isValidCategoryList(categories: unknown): categories is ClassCategory[] {
  return (
    Array.isArray(categories) &&
    categories.length > 0 &&
    categories.every((c) => Object.values(ClassCategory).includes(c))
  );
}

export const createSubject = async (req: Request, res: Response): Promise<Response> => {
  const { name, code, categories } = req.body;

  if (!name || !code || !categories) {
    return res.status(400).json({ error: 'name, code, and categories are required.' });
  }

  if (!isValidCategoryList(categories)) {
    return res.status(400).json({ error: 'categories must be a non-empty list of valid categories.' });
  }

  try {
    const subject = await prisma.subject.create({ data: { name, code, categories } });
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
  const { name, code, categories } = req.body;

  if (categories !== undefined && !isValidCategoryList(categories)) {
    return res.status(400).json({ error: 'categories must be a non-empty list of valid categories.' });
  }

  try {
    const updated = await prisma.subject.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(code !== undefined ? { code } : {}),
        ...(categories !== undefined ? { categories } : {}),
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

// Additive only — creates whichever standard NaCCA subjects are missing
// (matched by code) and leaves existing subjects untouched. Safe to re-run.
export const loadStandardSubjects = async (req: Request, res: Response): Promise<Response> => {
  try {
    const count = await ensureStandardSubjects(prisma);
    return res.status(200).json({ message: `${count} standard subject(s) added.`, count });
  } catch (error) {
    console.error('Load Standard Subjects Error:', error);
    return res.status(500).json({ error: 'Internal server error while loading standard subjects.' });
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
