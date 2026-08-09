import { Router } from 'express';
import { createAcademicYear, listAcademicYears, updateAcademicYear } from '../controllers/academicYearController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, listAcademicYears);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createAcademicYear);
router.patch('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateAcademicYear);

export default router;
