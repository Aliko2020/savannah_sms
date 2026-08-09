import { Request, Response } from 'express';
import { prisma } from '../config/db';

const SETTINGS_ID = 'singleton';

export const getSchoolSettings = async (req: Request, res: Response): Promise<Response> => {
  const settings = await prisma.schoolSettings.findUnique({ where: { id: SETTINGS_ID } });

  if (!settings) {
    return res.status(404).json({ error: 'School settings have not been configured yet.' });
  }

  return res.status(200).json({ name: settings.name, address: settings.address, phone: settings.phone });
};

export const updateSchoolSettings = async (req: Request, res: Response): Promise<Response> => {
  const { name, address, phone } = req.body;

  if (!name || !address || !phone) {
    return res.status(400).json({ error: 'name, address, and phone are required.' });
  }

  const settings = await prisma.schoolSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { name, address, phone },
    create: { id: SETTINGS_ID, name, address, phone },
  });

  return res.status(200).json({ name: settings.name, address: settings.address, phone: settings.phone });
};
