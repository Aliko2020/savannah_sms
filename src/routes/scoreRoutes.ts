import { Router } from 'express';
import { listScores, saveScores } from '../controllers/scoreController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, listScores);
router.put('/', authenticate, saveScores);

export default router;
