import { Router } from 'express';
import {
  createClass,
  deleteClass,
  getClassAssessmentReport,
  getClassStudents,
  listClasses,
  updateClass,
} from '../controllers/classController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, listClasses);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createClass);
router.patch('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateClass);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), deleteClass);
router.get('/:id/students', authenticate, getClassStudents);
router.get('/:id/report', authenticate, getClassAssessmentReport);

export default router;
