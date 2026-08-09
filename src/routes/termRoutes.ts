import { Router } from 'express';
import { createTerm, getCurrentTerm, listTerms, updateTerm } from '../controllers/termController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/current', authenticate, getCurrentTerm);
router.get('/', authenticate, listTerms);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createTerm);
router.patch('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateTerm);

export default router;
