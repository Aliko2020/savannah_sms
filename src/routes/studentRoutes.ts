import { Router } from 'express';
import {
  createGuardian,
  getStudent,
  listStudents,
  resetStudentPassword,
  setOpeningBalance,
  updateGuardian,
} from '../controllers/studentController';
import { getStudentReportCard } from '../controllers/reportCardController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), listStudents);
router.get('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), getStudent);
// Not staff-only — a teacher may view/print a report card for their own
// form class, enforced inside the controller (mirrors getClassAssessmentReport).
router.get('/:id/report-card', authenticate, getStudentReportCard);
router.post('/:id/guardians', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createGuardian);
router.patch('/:id/guardians/:guardianId', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateGuardian);
router.patch('/:id/opening-balance', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), setOpeningBalance);
router.post('/:id/reset-password', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), resetStudentPassword);

export default router;
