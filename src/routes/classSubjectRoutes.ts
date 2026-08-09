import { Router } from 'express';
import {
  createClassSubject,
  deleteClassSubject,
  ensureClassSubject,
  listClassSubjects,
  updateClassSubject,
} from '../controllers/classSubjectController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), listClassSubjects);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createClassSubject);
router.post('/ensure', authenticate, authorize('TEACHER'), ensureClassSubject);
router.patch('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateClassSubject);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), deleteClassSubject);

export default router;
