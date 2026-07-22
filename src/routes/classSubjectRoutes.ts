import { Router } from 'express';
import {
  createClassSubject,
  deleteClassSubject,
  ensureClassSubject,
  listClassSubjects,
} from '../controllers/classSubjectController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), listClassSubjects);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createClassSubject);
router.post('/ensure', authenticate, authorize('TEACHER'), ensureClassSubject);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), deleteClassSubject);

export default router;
