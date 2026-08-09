import { Router } from 'express';
import {
  deleteTeacher,
  getMyTeacherProfile,
  getTeacher,
  listTeachers,
  resetTeacherPassword,
  updateTeacher,
} from '../controllers/teacherController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, listTeachers);
router.get('/me', authenticate, getMyTeacherProfile);
router.get('/:id', authenticate, getTeacher);
router.patch('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateTeacher);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), deleteTeacher);
router.post('/:id/reset-password', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), resetTeacherPassword);

export default router;
