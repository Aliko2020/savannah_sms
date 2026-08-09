import { Router } from 'express';
import { createGradeLevel, deleteGradeLevel, listGradeLevels, updateGradeLevel } from '../controllers/gradeLevelController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, listGradeLevels);
router.post('/', authenticate, authorize('SUPER_ADMIN'), createGradeLevel);
router.patch('/:id', authenticate, authorize('SUPER_ADMIN'), updateGradeLevel);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), deleteGradeLevel);

export default router;
