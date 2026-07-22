import { Router } from 'express';
import { createAcademicYear, listAcademicYears } from '../controllers/academicYearController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, listAcademicYears);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createAcademicYear);

export default router;
