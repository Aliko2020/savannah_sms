import { Router } from 'express';
import { prisma } from '../config/db';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'db_unreachable' });
  }
});

export default router;