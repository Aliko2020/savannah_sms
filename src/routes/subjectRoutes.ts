import { Router } from 'express';
import { createSubject, deleteSubject, listSubjects, updateSubject } from '../controllers/subjectController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, listSubjects);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createSubject);
router.patch('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateSubject);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), deleteSubject);

export default router;
