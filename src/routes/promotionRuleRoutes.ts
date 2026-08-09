import { Router } from 'express';
import {
  deleteGradeLevelPromotionRule,
  listPromotionRules,
  upsertDefaultPromotionRule,
  upsertGradeLevelPromotionRule,
} from '../controllers/promotionRuleController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, listPromotionRules);
router.put('/default', authenticate, authorize('SUPER_ADMIN'), upsertDefaultPromotionRule);
router.put('/grade-level/:gradeLevelId', authenticate, authorize('SUPER_ADMIN'), upsertGradeLevelPromotionRule);
router.delete('/grade-level/:gradeLevelId', authenticate, authorize('SUPER_ADMIN'), deleteGradeLevelPromotionRule);

export default router;
