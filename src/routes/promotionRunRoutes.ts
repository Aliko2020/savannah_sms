import { Router } from 'express';
import {
  createPromotionRun,
  deletePromotionRun,
  executePromotionRun,
  getPromotionRun,
  listPromotionRuns,
  overridePromotionResult,
} from '../controllers/promotionRunController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, authorize('SUPER_ADMIN'), listPromotionRuns);
router.post('/', authenticate, authorize('SUPER_ADMIN'), createPromotionRun);
router.get('/:id', authenticate, authorize('SUPER_ADMIN'), getPromotionRun);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), deletePromotionRun);
router.patch('/:id/results/:resultId', authenticate, authorize('SUPER_ADMIN'), overridePromotionResult);
router.post('/:id/execute', authenticate, authorize('SUPER_ADMIN'), executePromotionRun);

export default router;
