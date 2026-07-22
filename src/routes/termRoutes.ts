import { Router } from 'express';
import { createTerm, listTerms } from '../controllers/termController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, listTerms);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createTerm);

export default router;
